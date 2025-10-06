// @ts-ignore - Deno import URL
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
// @ts-ignore - Deno global
declare const Deno: any;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Top 20 FIFA (ejemplo estático; idealmente mantener en settings o actualizar periódicamente)
// Usaremos nombres para filtrar rápidamente; si hay discrepancias de nombre, ajustar a IDs del API
const FIFA_TOP20_NAMES = new Set<string>([
  'Argentina','France','Belgium','England','Brazil','Netherlands','Portugal','Spain','Italy','Croatia',
  'Uruguay','USA','Morocco','Colombia','Mexico','Germany','Switzerland','Senegal','Japan','Iran'
]);

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const footballApiKey = Deno.env.get('API_FOOTBALL_KEY');
    if (!footballApiKey) throw new Error('API_FOOTBALL_KEY is not set');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Example: World Cup Qualification UEFA league = 13? We instead fetch by international friendly/qualification
    // For simplicity: use API endpoint for odds by league=??? or by teams. Here we fetch next N odds for internationals.
    // This is a placeholder approach; adjust league/filters to match desired competitions for Selecciones.
    // Build date window (today + 6 days)
    const makeDate = (d: Date) => d.toISOString().slice(0, 10);
    const today = new Date();
    const dates: string[] = Array.from({ length: 7 }).map((_, i) => {
      const d = new Date(today);
      d.setUTCDate(d.getUTCDate() + i);
      return makeDate(d);
    });

    // Load enabled teams list from betting_settings (required filter)
    const { data: setting } = await supabase
      .from('betting_settings')
      .select('setting_value')
      .eq('setting_key', 'selecciones_enabled_teams')
      .maybeSingle();
    let enabledTeams = new Set<string>();
    if (setting?.setting_value) {
      try {
        const parsed = JSON.parse(setting.setting_value);
        if (Array.isArray(parsed)) enabledTeams = new Set(parsed);
      } catch {}
    }

    // Step 1: Fetch fixtures by date, filter by World Cup Qualification leagues only
    const isWorldCupQualification = (leagueName?: string) => {
      if (!leagueName || typeof leagueName !== 'string') return false;
      const n = leagueName.toLowerCase();
      return n.includes('world cup') && n.includes('qualification');
    };

    const allFixtures: any[] = [];
    for (const date of dates) {
      const url = `https://v3.football.api-sports.io/fixtures?date=${date}`;
      const res = await fetch(url, { headers: { 'x-apisports-key': footballApiKey } });
      if (!res.ok) continue;
      const json = await res.json().catch(() => null);
      const items = Array.isArray(json?.response) ? json.response : [];
      // Filter by World Cup Qualification leagues only
      const wcq = items.filter((it: any) => isWorldCupQualification(it?.league?.name));
      allFixtures.push(...wcq);
    }

    // Map teams and fixture IDs
    const teamsByFixture = new Map<number, any>();
    const fixtureIds: number[] = [];
    allFixtures.forEach((it: any) => {
      const fxId = it?.fixture?.id;
      if (fxId && it?.teams) {
        const leagueName = it?.league?.name || 'World Cup - Qualification';
        const fixtureDate = it?.fixture?.date || null;
        const homeName = it?.teams?.home?.name;
        const awayName = it?.teams?.away?.name;
        // Pre-filter: only include fixtures where at least one team is enabled
        if ((homeName && enabledTeams.has(homeName)) || (awayName && enabledTeams.has(awayName))) {
          teamsByFixture.set(fxId, { ...it.teams, league_name: leagueName, fixture_date: fixtureDate });
          fixtureIds.push(fxId);
        }
      }
    });

    // Step 2: Fetch odds per fixture and merge
    const mergedOdds: any[] = [];
    for (const fxId of fixtureIds) {
      const oddsUrl = `https://v3.football.api-sports.io/odds?fixture=${fxId}`;
      const oddsRes = await fetch(oddsUrl, { headers: { 'x-apisports-key': footballApiKey } });
      if (!oddsRes.ok) {
        // Create placeholder with date
        const t = teamsByFixture.get(fxId);
        mergedOdds.push({ fixture: { id: fxId, date: t?.fixture_date || null }, teams: t, bookmakers: [] });
        continue;
      }
      const oddsJson = await oddsRes.json().catch(() => null);
      if (Array.isArray(oddsJson?.response) && oddsJson.response.length > 0) {
        const t = teamsByFixture.get(fxId);
        oddsJson.response.forEach((entry: any) => {
          const withDate = t ? { ...entry, teams: t, fixture: { ...(entry.fixture || {}), id: fxId, date: t?.fixture_date || entry?.fixture?.date || null } } : entry;
          mergedOdds.push(withDate);
        });
      } else {
        const t = teamsByFixture.get(fxId);
        mergedOdds.push({ fixture: { id: fxId, date: t?.fixture_date || null }, teams: t, bookmakers: [] });
      }
    }

    const payload = { response: mergedOdds };

    // Write to cache id=2 (Selecciones)
    const { error } = await supabase
      .from('match_odds_cache')
      .upsert({ id: 2, data: payload, last_updated: new Date().toISOString() });
    if (error) throw error;

    // Upsert kickoff times and team names to match_results - ONLY for fixtures we're actually caching (with enabled teams)
    const matchResultsUpserts = allFixtures
      .filter((fx: any) => {
        // Only include fixtures that have enabled teams (same filter as for odds)
        const homeName = fx?.teams?.home?.name;
        const awayName = fx?.teams?.away?.name;
        return fx?.fixture?.id && fx?.fixture?.date && fx?.teams && 
               ((homeName && enabledTeams.has(homeName)) || (awayName && enabledTeams.has(awayName)));
      })
      .map((fx: any) => ({
        fixture_id: fx.fixture.id,
        kickoff_time: fx.fixture.date,
        home_team: fx.teams.home.name,
        away_team: fx.teams.away.name,
      }));

    if (matchResultsUpserts.length > 0) {
      const { error: matchResultsError } = await supabase
        .from('match_results')
        .upsert(matchResultsUpserts, { onConflict: 'fixture_id', ignoreDuplicates: false });
      if (matchResultsError) {
        // Log but don't fail the whole request
        console.warn('Selecciones: failed to upsert match_results:', matchResultsError.message);
      }
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Selecciones odds cache updated', matches_count: mergedOdds.length }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e?.message || e) }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});


