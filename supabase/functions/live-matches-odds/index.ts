// @ts-ignore - Deno import URL
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

// @ts-ignore - Deno global
declare const Deno: any;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

// Live fixtures to watch are configured by SuperAdmin in betting_settings.
// Snapshots are stored for OddsIndicator evolution in match_odds_cache:
// - 9 = current
// - 10 = previous
const LIVE_MATCHES_CURRENT_CACHE_ID = 9;
const LIVE_MATCHES_PREVIOUS_CACHE_ID = 10;
const LIVE_MATCHES_SETTINGS_KEY = 'live_matches_selected';
const LIVE_MATCHES_ENABLED_KEY = 'live_matches_enabled';

// Helper function to get the correct season year (Aug-Jul)
const getSeasonYear = () => {
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();
  return currentMonth >= 8 ? currentYear : currentYear - 1;
};

// Helper function to make API requests with timeout
const fetchWithTimeout = async (url: string, options: RequestInit, timeoutMs: number = 15000) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error?.name === 'AbortError') {
      throw new Error(`Request timeout after ${timeoutMs}ms`);
    }
    throw error;
  }
};

const isLiveStatus = (statusShort: string | null | undefined) => {
  if (!statusShort) return false;
  const s = String(statusShort).toUpperCase();
  // Common live statuses in API-Football: 1H, HT, 2H, ET, BT, P, INT
  return ['1H', 'HT', '2H', 'ET', 'BT', 'P', 'INT'].includes(s);
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY');
    const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const API_KEY = Deno.env.get('API_FOOTBALL_KEY');

    if (!SUPABASE_URL || (!SUPABASE_ANON_KEY && !SERVICE_ROLE_KEY) || !API_KEY) {
      return new Response(
        JSON.stringify({
          error: 'Missing required environment variables',
          missing: {
            SUPABASE_URL: !SUPABASE_URL,
            SUPABASE_ANON_KEY: !SUPABASE_ANON_KEY,
            SUPABASE_SERVICE_ROLE_KEY: !SERVICE_ROLE_KEY,
            API_FOOTBALL_KEY: !API_KEY,
          },
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // Require authenticated user (Edge Functions will also verify JWT by default)
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing Authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY || SERVICE_ROLE_KEY, {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false, autoRefreshToken: false },
    });
    // Admin client to write to match_odds_cache / read betting_settings (bypass RLS)
    const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    const { data: userData, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userData?.user?.id) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const baseUrl = 'https://v3.football.api-sports.io';
    const apiHeaders = {
      'x-apisports-key': API_KEY,
      'User-Agent': 'league-bets-beta/1.0',
      Accept: 'application/json',
    };

    // Step 0: read configured fixtures to watch
    const { data: enabledRow } = await supabaseAdmin
      .from('betting_settings')
      .select('setting_value')
      .eq('setting_key', LIVE_MATCHES_ENABLED_KEY)
      .maybeSingle();
    const liveEnabled = (((enabledRow as any)?.setting_value || 'false') === 'true');

    if (!liveEnabled) {
      // Clear snapshot so clients stop seeing live odds immediately
      try {
        const { data: currentRow } = await supabaseAdmin
          .from('match_odds_cache')
          .select('data, last_updated')
          .eq('id', LIVE_MATCHES_CURRENT_CACHE_ID)
          .maybeSingle();
        if (currentRow?.data) {
          await supabaseAdmin.from('match_odds_cache').upsert({
            id: LIVE_MATCHES_PREVIOUS_CACHE_ID,
            data: currentRow.data,
            info: 'Live Matches - previous odds snapshot',
            last_updated: currentRow.last_updated,
          });
        }
        await supabaseAdmin.from('match_odds_cache').upsert({
          id: LIVE_MATCHES_CURRENT_CACHE_ID,
          data: { response: [] },
          info: 'Live Matches - current odds snapshot',
          last_updated: new Date().toISOString(),
        });
      } catch {}

      return new Response(
        JSON.stringify({
          success: true,
          enabled: false,
          total_fixtures: 0,
          live_fixtures: 0,
          live_fixture_ids: [],
          response: [],
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const { data: settingRow } = await supabaseAdmin
      .from('betting_settings')
      .select('setting_value')
      .eq('setting_key', LIVE_MATCHES_SETTINGS_KEY)
      .maybeSingle();

    let selected: any[] = [];
    if ((settingRow as any)?.setting_value) {
      try {
        const parsed = JSON.parse((settingRow as any).setting_value);
        if (Array.isArray(parsed)) selected = parsed;
      } catch {}
    }

    const selectedIds = new Set<number>(
      selected
        .map((x: any) => x?.fixture_id)
        .filter((id: any) => typeof id === 'number' && Number.isFinite(id)),
    );

    // If nothing selected, persist empty snapshot and return early
    if (selectedIds.size === 0) {
      try {
        const { data: currentRow } = await supabaseAdmin
          .from('match_odds_cache')
          .select('data, last_updated')
          .eq('id', LIVE_MATCHES_CURRENT_CACHE_ID)
          .maybeSingle();
        if (currentRow?.data) {
          await supabaseAdmin.from('match_odds_cache').upsert({
            id: LIVE_MATCHES_PREVIOUS_CACHE_ID,
            data: currentRow.data,
            info: 'Live Matches - previous odds snapshot',
            last_updated: currentRow.last_updated,
          });
        }
        await supabaseAdmin.from('match_odds_cache').upsert({
          id: LIVE_MATCHES_CURRENT_CACHE_ID,
          data: { response: [] },
          info: 'Live Matches - current odds snapshot',
          last_updated: new Date().toISOString(),
        });
      } catch {}

      return new Response(
        JSON.stringify({
          success: true,
          total_fixtures: 0,
          live_fixtures: 0,
          live_fixture_ids: [],
          response: [],
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // Step 1: fetch all live fixtures once, then filter by selected fixture ids
    const liveFixturesResp = await fetchWithTimeout(`${baseUrl}/fixtures?live=all`, { headers: apiHeaders }, 15000);
    const liveFixturesJson = liveFixturesResp.ok ? await liveFixturesResp.json().catch(() => null) : null;
    const liveFixtures = Array.isArray(liveFixturesJson?.response) ? liveFixturesJson.response : [];

    const liveById = new Map<number, any>();
    liveFixtures.forEach((fx: any) => {
      const id = fx?.fixture?.id;
      if (!id || !selectedIds.has(id)) return;
      liveById.set(id, fx);
    });

    const liveFixtureIds = Array.from(liveById.keys());

    // Build base match objects from config; attach live meta if currently live
    const baseMatches = new Map<number, any>();
    selected.forEach((cfg: any) => {
      const id = cfg?.fixture_id;
      if (!id || !selectedIds.has(id)) return;

      const liveFx = liveById.get(id);
      const statusShort = liveFx?.fixture?.status?.short;
      const isLive = !!liveFx || isLiveStatus(statusShort);

      const league =
        liveFx?.league ??
        (cfg?.league_id || cfg?.league_name ? { id: cfg?.league_id, name: cfg?.league_name, season: getSeasonYear() } : undefined);

      baseMatches.set(id, {
        fixture: {
          id,
          date: cfg?.kickoff_time ?? liveFx?.fixture?.date ?? null,
          status: liveFx?.fixture?.status,
          is_live: isLive,
        },
        league,
        teams: {
          home: {
            id: liveFx?.teams?.home?.id,
            name: cfg?.home_team ?? liveFx?.teams?.home?.name,
            logo: liveFx?.teams?.home?.logo,
          },
          away: {
            id: liveFx?.teams?.away?.id,
            name: cfg?.away_team ?? liveFx?.teams?.away?.name,
            logo: liveFx?.teams?.away?.logo,
          },
          league_id: cfg?.league_id,
          league_name: cfg?.league_name,
          fixture_date: cfg?.kickoff_time ?? liveFx?.fixture?.date ?? null,
          is_live: isLive,
        },
        bookmakers: [],
      });
    });

    const fixtureIds = Array.from(baseMatches.keys());

    // Step 2: Fetch odds only for live fixtures (when match started)
    // For live matches, the standard odds endpoint should return live odds automatically
    for (const fxId of fixtureIds) {
      const base = baseMatches.get(fxId);
      const isLive = !!base?.teams?.is_live;
      if (!isLive) continue;

      // Live odds in API-Football are exposed via /odds/live.
      // We first try the live endpoint (in-play odds), and fallback to /odds?fixture= (pre-match/latest snapshot).
      const requestHeaders = {
        ...apiHeaders,
        'Cache-Control': 'no-cache',
      };

      const fetchOdds = async (url: string, label: string) => {
        const res = await fetchWithTimeout(url, { headers: requestHeaders }, 15000).catch((err) => {
          console.error(`Error fetching ${label} odds for fixture ${fxId}:`, err);
          return null;
        });
        if (!res || !res.ok) return { res, json: null as any, resp: [] as any[] };
        const json = await res.json().catch((err) => {
          console.error(`Error parsing ${label} odds JSON for fixture ${fxId}:`, err);
          return null;
        });
        const resp = Array.isArray(json?.response) ? json.response : [];
        return { res, json, resp };
      };

      const liveOddsUrl = `${baseUrl}/odds/live?fixture=${fxId}`;
      const fallbackUrl = `${baseUrl}/odds?fixture=${fxId}`;
      const leagueLiveUrl = base?.league?.id ? `${baseUrl}/odds/live?league=${base.league.id}` : null;

      // 1) Try live odds for this specific fixture
      let chosen = await fetchOdds(liveOddsUrl, 'LIVE_FIXTURE');

      // 2) If empty, try live odds for the entire league (sometimes fixture param is buggy in live)
      if (chosen.resp.length === 0 && leagueLiveUrl) {
        console.log(`Fixture ${fxId} returned no live odds; trying league ${base.league.id} live odds...`);
        const leagueLive = await fetchOdds(leagueLiveUrl, 'LIVE_LEAGUE');
        const fixtureInLeague = leagueLive.resp.filter((r: any) => r?.fixture?.id === fxId);
        if (fixtureInLeague.length > 0) {
          console.log(`Found live odds for fixture ${fxId} in league live response!`);
          chosen = { ...leagueLive, resp: fixtureInLeague };
        }
      }

      // 3) If still empty, try fallback to standard odds endpoint
      if (chosen.resp.length === 0) {
        chosen = await fetchOdds(fallbackUrl, 'FALLBACK');
      }

      // 4) Final check
      if (!chosen.res || !chosen.res.ok) {
        console.warn(`Failed to fetch odds for fixture ${fxId}: Status ${chosen.res?.status}`);
        continue;
      }

      const resp = chosen.resp || [];
      
      // Process odds response
      if (resp.length === 0) {
        console.warn(`No odds data returned for fixture ${fxId} - keeping base match structure`);
        // Keep base match structure even if no odds returned
      } else {
        // API-Football may return multiple entries for the same fixture; merge bookmakers across them.
        const allBookmakers = resp
          .map((r: any) => r?.bookmakers)
          .filter((b: any) => Array.isArray(b))
          .flat();

        // Choose a representative entry (first one with league/fixture data if possible)
        const entry =
          resp.find((r: any) => r?.league || r?.fixture) ??
          resp[0];

        // Check if odds are outdated (update timestamp is before match start)
        const updateTime = entry?.update ? new Date(entry.update).getTime() : null;
        const matchStartTime = base?.fixture?.date ? new Date(base.fixture.date).getTime() : null;
        const isOddsOutdated = updateTime && matchStartTime && updateTime < matchStartTime;

        const bookmakersCount = Array.isArray(allBookmakers) ? allBookmakers.length : 0;
        if (bookmakersCount === 0) {
          console.warn(`Fixture ${fxId} has no bookmakers - update: ${entry?.update}`);
        } else {
          const statusMsg = isOddsOutdated ? 'OUTDATED (pre-match odds)' : 'CURRENT';
          console.log(`Fixture ${fxId} has ${bookmakersCount} bookmakers (merged from ${resp.length} entries) - update: ${entry?.update} [${statusMsg}]`);
        }

        baseMatches.set(fxId, {
          ...base,
          league: entry?.league ?? base?.league,
          fixture: { ...(entry?.fixture || {}), ...(base?.fixture || {}), id: fxId, date: base?.fixture?.date || entry?.fixture?.date || null },
          teams: base?.teams ?? entry?.teams,
          bookmakers: allBookmakers,
          update: entry?.update,
        });
      }
    }

    const mergedOdds: any[] = Array.from(baseMatches.values())
      .filter((m: any) => m?.fixture?.id)
      .sort((a: any, b: any) => new Date(a?.fixture?.date || 0).getTime() - new Date(b?.fixture?.date || 0).getTime());

    // Persist to match_odds_cache for odds evolution indicators
    try {
      // Copy current -> previous
      const { data: currentRow } = await supabaseAdmin
        .from('match_odds_cache')
        .select('data, last_updated')
        .eq('id', LIVE_MATCHES_CURRENT_CACHE_ID)
        .maybeSingle();

      if (currentRow?.data) {
        await supabaseAdmin.from('match_odds_cache').upsert({
          id: LIVE_MATCHES_PREVIOUS_CACHE_ID,
          data: currentRow.data,
          info: 'Live Matches - previous odds snapshot',
          last_updated: currentRow.last_updated,
        });
      }

      // Write new current snapshot
      await supabaseAdmin.from('match_odds_cache').upsert({
        id: LIVE_MATCHES_CURRENT_CACHE_ID,
        data: { response: mergedOdds },
        info: 'Live Matches - current odds snapshot',
        last_updated: new Date().toISOString(),
      });
    } catch (e: any) {
      console.warn('Could not persist live matches odds to match_odds_cache:', e?.message || String(e));
    }

    return new Response(
      JSON.stringify({
        success: true,
        total_fixtures: mergedOdds.length,
        live_fixtures: liveFixtureIds.length,
        live_fixture_ids: liveFixtureIds,
        response: mergedOdds,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (e: any) {
    return new Response(JSON.stringify({ error: String(e?.message || e) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});


