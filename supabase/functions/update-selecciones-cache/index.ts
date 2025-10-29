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

    // Step 1: Fetch fixtures by date, filter by World Cup Qualification leagues and Copa del Rey
    const isWorldCupQualification = (leagueName?: string) => {
      if (!leagueName || typeof leagueName !== 'string') return false;
      const n = leagueName.toLowerCase();
      return n.includes('world cup') && n.includes('qualification');
    };

    const isCopaDelRey = (leagueId?: number) => {
      return leagueId === 143; // Copa del Rey league ID
    };

    const allFixtures: any[] = [];
    const copaFixtures: any[] = [];
    
    for (const date of dates) {
      const url = `https://v3.football.api-sports.io/fixtures?date=${date}`;
      const res = await fetch(url, { headers: { 'x-apisports-key': footballApiKey } });
      if (!res.ok) continue;
      const json = await res.json().catch(() => null);
      const items = Array.isArray(json?.response) ? json.response : [];
      
      // Filter by World Cup Qualification leagues
      const wcq = items.filter((it: any) => isWorldCupQualification(it?.league?.name));
      allFixtures.push(...wcq);
      
      // Filter by Copa del Rey
      const copa = items.filter((it: any) => isCopaDelRey(it?.league?.id));
      copaFixtures.push(...copa);
    }

    // Map teams and fixture IDs for Selecciones
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

    // Map teams and fixture IDs for Copa del Rey
    const copaTeamsByFixture = new Map<number, any>();
    const copaFixtureIds: number[] = [];
    copaFixtures.forEach((it: any) => {
      const fxId = it?.fixture?.id;
      if (fxId && it?.teams) {
        const leagueName = it?.league?.name || 'Copa del Rey';
        const fixtureDate = it?.fixture?.date || null;
        copaTeamsByFixture.set(fxId, { ...it.teams, league_name: leagueName, fixture_date: fixtureDate });
        copaFixtureIds.push(fxId);
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

    // Step 3: Fetch odds for Copa del Rey fixtures
    const copaMergedOdds: any[] = [];
    for (const fxId of copaFixtureIds) {
      const oddsUrl = `https://v3.football.api-sports.io/odds?fixture=${fxId}`;
      const oddsRes = await fetch(oddsUrl, { headers: { 'x-apisports-key': footballApiKey } });
      if (!oddsRes.ok) {
        // Create placeholder with date
        const t = copaTeamsByFixture.get(fxId);
        copaMergedOdds.push({ fixture: { id: fxId, date: t?.fixture_date || null }, teams: t, bookmakers: [] });
        continue;
      }
      const oddsJson = await oddsRes.json().catch(() => null);
      if (Array.isArray(oddsJson?.response) && oddsJson.response.length > 0) {
        const t = copaTeamsByFixture.get(fxId);
        oddsJson.response.forEach((entry: any) => {
          const withDate = t ? { ...entry, teams: t, fixture: { ...(entry.fixture || {}), id: fxId, date: t?.fixture_date || entry?.fixture?.date || null } } : entry;
          copaMergedOdds.push(withDate);
        });
      } else {
        const t = copaTeamsByFixture.get(fxId);
        copaMergedOdds.push({ fixture: { id: fxId, date: t?.fixture_date || null }, teams: t, bookmakers: [] });
      }
    }

    const seleccionesPayload = { response: mergedOdds };
    const copaPayload = { response: copaMergedOdds };

    // Before writing current selecciones (id=3), copy existing id=3 data AND date to id=4 (previous)
    try {
      const { data: currentSel } = await supabase
        .from('match_odds_cache')
        .select('data, last_updated')
        .eq('id', 3)
        .maybeSingle();
      if (currentSel && currentSel.data) {
        await supabase
          .from('match_odds_cache')
          .upsert({ 
            id: 4, 
            data: currentSel.data, 
            info: 'Selecciones - previous odds snapshot', 
            last_updated: currentSel.last_updated // Copy the date from current row
          });
      }
    } catch (copyErr) {
      console.warn('Selecciones: could not copy id=3 -> id=4:', (copyErr as Error).message);
    }

    // Before writing current copa (id=5), copy existing id=5 data AND date to id=6 (previous)
    try {
      const { data: currentCopa } = await supabase
        .from('match_odds_cache')
        .select('data, last_updated')
        .eq('id', 5)
        .maybeSingle();
      if (currentCopa && currentCopa.data) {
        await supabase
          .from('match_odds_cache')
          .upsert({ 
            id: 6, 
            data: currentCopa.data, 
            info: 'Copa del Rey - previous odds snapshot', 
            last_updated: currentCopa.last_updated // Copy the date from current row
          });
      }
    } catch (copyErr) {
      console.warn('Copa del Rey: could not copy id=5 -> id=6:', (copyErr as Error).message);
    }

    // Write to cache id=3 (Selecciones current)
    const { error: selError } = await supabase
      .from('match_odds_cache')
      .upsert({ id: 3, data: seleccionesPayload, info: 'Selecciones - current odds snapshot', last_updated: new Date().toISOString() });
    if (selError) throw selError;

    // Write to cache id=5 (Copa del Rey current)
    const { error: copaError } = await supabase
      .from('match_odds_cache')
      .upsert({ id: 5, data: copaPayload, info: 'Copa del Rey - current odds snapshot', last_updated: new Date().toISOString() });
    if (copaError) throw copaError;

    // Upsert kickoff times and team names to match_results - for both Selecciones and Copa del Rey
    const seleccionesMatchResults = allFixtures
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

    const copaMatchResults = copaFixtures
      .filter((fx: any) => fx?.fixture?.id && fx?.fixture?.date && fx?.teams)
      .map((fx: any) => ({
        fixture_id: fx.fixture.id,
        kickoff_time: fx.fixture.date,
        home_team: fx.teams.home.name,
        away_team: fx.teams.away.name,
      }));

    const matchResultsUpserts = [...seleccionesMatchResults, ...copaMatchResults];

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
      JSON.stringify({ 
        success: true, 
        message: 'Selecciones and Copa del Rey odds cache updated', 
        selecciones_matches: mergedOdds.length,
        copa_matches: copaMergedOdds.length,
        total_matches: mergedOdds.length + copaMergedOdds.length
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e?.message || e) }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});


