// @ts-ignore - Deno imports
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// @ts-ignore - Deno global
declare const Deno: any;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-api-version, x-internal-secret',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
}

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

const fetchWithTimeout = async (url: string, options: RequestInit, timeoutMs: number = 10000) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if ((error as any).name === 'AbortError') {
      throw new Error(`Request timeout after ${timeoutMs}ms`);
    }
    throw error;
  }
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    console.log("=== update-coparey-cache START ===");
    console.log("Request headers:", Object.fromEntries(req.headers.entries()));
    
    const INTERNAL_SECRET = Deno.env.get('INTERNAL_FUNCTION_SECRET');
    console.log("INTERNAL_SECRET from env present:", !!INTERNAL_SECRET);
    console.log("INTERNAL_SECRET from env prefix:", INTERNAL_SECRET ? INTERNAL_SECRET.slice(0, 5) : 'none');
    
    const body = await req.json().catch(() => ({}));
    console.log("Body keys:", Object.keys(body));
    console.log("Body internal_secret present:", !!body?.internal_secret);
    console.log("Body internal_secret prefix:", body?.internal_secret ? String(body.internal_secret).slice(0, 5) : 'none');
    
    const headerSecret = req.headers.get('x-internal-secret');
    console.log("Header x-internal-secret present:", !!headerSecret);
    console.log("Header x-internal-secret prefix:", headerSecret ? headerSecret.slice(0, 5) : 'none');
    
    const headerSecretMatches = headerSecret === INTERNAL_SECRET;
    const bodySecretMatches = body?.internal_secret === INTERNAL_SECRET;
    console.log("Header secret matches:", headerSecretMatches);
    console.log("Body secret matches:", bodySecretMatches);
    
    if (!INTERNAL_SECRET || (headerSecret !== INTERNAL_SECRET && body?.internal_secret !== INTERNAL_SECRET)) {
      console.log("UNAUTHORIZED - Secret mismatch");
      return new Response(JSON.stringify({ 
        error: 'Unauthorized - Invalid internal secret',
        debug: {
          hasEnvSecret: !!INTERNAL_SECRET,
          hasHeaderSecret: !!headerSecret,
          hasBodySecret: !!body?.internal_secret,
          headerMatch: headerSecretMatches,
          bodyMatch: bodySecretMatches
        }
      }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    
    console.log("AUTH OK - proceeding with odds fetch");

    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const API_KEY = Deno.env.get('API_FOOTBALL_KEY');
    if (!SUPABASE_URL || !SERVICE_ROLE_KEY || !API_KEY) {
      return new Response(JSON.stringify({ error: 'Missing env vars' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    // Copa del Rey league ID
    const leagueId = 143;
    const currentYear = new Date().getFullYear();
    const matchesPerLeague = 10;

    // 1) Fetch next fixtures for Copa del Rey
    const fixturesUrl = `https://v3.football.api-sports.io/fixtures?league=${leagueId}&season=${currentYear}&next=${matchesPerLeague}`;
    const fixturesResponse = await fetchWithTimeout(fixturesUrl, { headers: { 'x-apisports-key': API_KEY } }, 15000);
    if (!fixturesResponse.ok) {
      const errorText = await fixturesResponse.text().catch(() => '');
      return new Response(JSON.stringify({ error: `fixtures error: ${fixturesResponse.status} ${errorText}` }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const fixturesData = await fixturesResponse.json();
    const allFixturesData: any[] = fixturesData.response || [];
    const fixtureIDs: number[] = allFixturesData.map((it: any) => it?.fixture?.id).filter(Boolean);

    // Map teams by fixture
    const teamsByFixture = new Map<number, any>();
    allFixturesData.forEach((item: any) => {
      if (item?.fixture?.id && item?.teams) {
        teamsByFixture.set(item.fixture.id, {
          ...item.teams,
          league_id: leagueId,
          league_name: 'Copa del Rey'
        });
      }
    });

    // 2) Fetch odds for each fixture
    const allOddsData: any[] = [];
    for (const fxId of fixtureIDs) {
      const oddsUrl = `https://v3.football.api-sports.io/odds?fixture=${fxId}`;
      try {
        const oddsRes = await fetchWithTimeout(oddsUrl, { headers: { 'x-apisports-key': API_KEY } }, 20000);
        if (oddsRes.ok) {
          const oddsJson = await oddsRes.json();
          if (Array.isArray(oddsJson?.response) && oddsJson.response.length > 0) {
            allOddsData.push(...oddsJson.response);
          } else {
            const t = teamsByFixture.get(fxId);
            const originalFx = allFixturesData.find(f => f?.fixture?.id === fxId);
            const date = originalFx?.fixture?.date || null;
            allOddsData.push({ fixture: { id: fxId, date }, teams: t, bookmakers: [] });
          }
        } else {
          const t = teamsByFixture.get(fxId);
          const originalFx = allFixturesData.find(f => f?.fixture?.id === fxId);
          const date = originalFx?.fixture?.date || null;
          allOddsData.push({ fixture: { id: fxId, date }, teams: t, bookmakers: [] });
        }
      } catch (_) {
        const t = teamsByFixture.get(fxId);
        const originalFx = allFixturesData.find(f => f?.fixture?.id === fxId);
        const date = originalFx?.fixture?.date || null;
        allOddsData.push({ fixture: { id: fxId, date }, teams: t, bookmakers: [] });
      }
      await delay(800);
    }

    // Merge teams into odds
    const mergedOdds = allOddsData.map((entry: any) => {
      const fxId = entry?.fixture?.id;
      const t = fxId ? teamsByFixture.get(fxId) : null;
      return t ? { ...entry, teams: t } : entry;
    });

    const finalCacheObject = { response: mergedOdds };

    // Copy current id=5 to id=6 (previous)
    try {
      const { data: currentRow } = await supabase
        .from('match_odds_cache')
        .select('data')
        .eq('id', 5)
        .maybeSingle();
      if (currentRow?.data) {
        await supabase
          .from('match_odds_cache')
          .upsert({ id: 6, data: currentRow.data, info: 'Copa del Rey - previous odds snapshot', last_updated: new Date().toISOString() });
      }
    } catch (e) {
      console.warn('Copy id=5 -> id=6 failed:', (e as Error).message);
    }

    // Write current payload to id=5
    const { error: upsertError } = await supabase
      .from('match_odds_cache')
      .upsert({ id: 5, data: finalCacheObject, info: 'Copa del Rey - current odds snapshot', last_updated: new Date().toISOString() });
    if (upsertError) throw upsertError;

    // Upsert kickoff times to match_results
    const matchResultsUpserts = allFixturesData
      .filter(fx => fx?.fixture?.id && fx?.fixture?.date && fx?.teams)
      .map(fx => ({
        fixture_id: fx.fixture.id,
        kickoff_time: fx.fixture.date,
        home_team: fx.teams.home.name,
        away_team: fx.teams.away.name,
      }));
    if (matchResultsUpserts.length > 0) {
      await supabase.from('match_results').upsert(matchResultsUpserts, { onConflict: 'fixture_id', ignoreDuplicates: false });
    }

    // Optionally schedule result processing similar to leagues
    try {
      const times: number[] = allFixturesData.map((it: any) => Date.parse(it?.fixture?.date || '')).filter((n: number) => Number.isFinite(n));
      if (times.length > 0) {
        const latestKickoff = Math.max(...times);
        const dynamicRunTime = new Date(latestKickoff + 5 * 60 * 60 * 1000);
        const cronExpr = `${dynamicRunTime.getUTCMinutes()} ${dynamicRunTime.getUTCHours()} ${dynamicRunTime.getUTCDate()} ${dynamicRunTime.getUTCMonth() + 1} *`;

        const SUPABASE_URL_FOR_SCHEDULE = Deno.env.get('SUPABASE_URL');
        const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY');
        const authHeader = ANON_KEY ? `Bearer ${ANON_KEY}` : '';
        const { data: jobId } = await supabase.rpc('schedule_one_time_http_call', {
          job_name: `process-coparey-results-${Math.floor(dynamicRunTime.getTime() / 1000)}`,
          schedule: cronExpr,
          url: `${SUPABASE_URL_FOR_SCHEDULE}/functions/v1/secure-run-process-coparey-results`,
          auth_header: authHeader,
          body: JSON.stringify({ reason: 'auto-scheduled by update-coparey-cache', target_time: dynamicRunTime.toISOString() })
        });
        console.log('Scheduled coparey process job id:', jobId);
      }
    } catch (e) {
      console.warn('Scheduling coparey results failed (non-fatal):', (e as Error).message);
    }

    return new Response(JSON.stringify({ ok: true, fixtures: fixtureIDs.length, odds: mergedOdds.length }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (e) {
    return new Response(JSON.stringify({ error: String((e as Error).message) }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});


