import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

console.log(`Function "update-football-cache" is starting.`);

// Helper function to add a delay between API calls to respect rate limits
const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

Deno.serve(async (req) => {
  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
    console.log("Supabase admin client initialized.");

    const apiKey = Deno.env.get('API_FOOTBALL_KEY');
    if (!apiKey) {
      throw new Error('API_FOOTBALL_KEY is not set in Edge Function secrets.');
    }
    console.log('API Key found. Starting two-step odds fetch...');

    // --- STEP 1: Fetch the NEXT 10 upcoming fixture IDs ---
    const leagueId = 140; // La Liga
    const currentYear = new Date().getFullYear();
    const fixturesUrl = `https://v3.football.api-sports.io/fixtures?league=${leagueId}&season=${currentYear}&next=10`;
    console.log(`Fetching fixtures from: ${fixturesUrl}`);
    
    const fixturesResponse = await fetch(fixturesUrl, {
      headers: {
        'x-apisports-key': apiKey,
      },
    });

    if (!fixturesResponse.ok) {
      throw new Error(`Failed to fetch fixtures: ${await fixturesResponse.text()}`);
    }

    const fixturesData = await fixturesResponse.json();
    const fixtureIDs: number[] = fixturesData.response.map((item: any) => item.fixture.id);
    const teamsByFixture = new Map<number, any>();
    fixturesData.response.forEach((item: any) => {
      if (item?.fixture?.id && item?.teams) teamsByFixture.set(item.fixture.id, item.teams);
    });
    console.log(`Found ${fixtureIDs.length} upcoming fixtures.`);
    if (fixtureIDs.length === 0) {
      console.log('No upcoming fixtures found. Cache will not be updated.');
       return new Response(JSON.stringify({ message: 'No upcoming fixtures to fetch odds for.' }), {
        headers: { 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    // --- STEP 2: Fetch odds for each of those fixture IDs ---
    const allOddsData = [];
    for (const fixtureId of fixtureIDs) {
      const oddsUrl = `https://v3.football.api-sports.io/odds?fixture=${fixtureId}`;
      console.log(`Fetching odds from: ${oddsUrl}`);
      const oddsResponse = await fetch(oddsUrl, {
        headers: {
          'x-apisports-key': apiKey,
        },
      });

      if (oddsResponse.ok) {
        const oddsJson = await oddsResponse.json();
        if (oddsJson.response && oddsJson.response.length > 0) {
            allOddsData.push(...oddsJson.response);
        }
      } else {
        console.warn(`Could not fetch odds for fixture ${fixtureId}: ${await oddsResponse.text()}`);
      }
      await delay(200); // Small delay to be safe with API limits
    }

    console.log(`Successfully fetched odds for ${allOddsData.length} matches.`);

    // --- STEP 3: Upsert the cache ---
    const mergedOdds = allOddsData.map((entry: any) => {
      const fxId = entry?.fixture?.id;
      const teams = fxId ? teamsByFixture.get(fxId) : null;
      return teams ? { ...entry, teams } : entry;
    });
    const finalCacheObject = { response: mergedOdds };
    const { error: upsertError } = await supabaseAdmin
      .from('match_odds_cache')
      .upsert({
        id: 1,
        data: finalCacheObject, 
        last_updated: new Date().toISOString(),
      });

    if (upsertError) {
      throw new Error(`Failed to upsert cache: ${upsertError.message}`);
    }
    
    console.log('Cache updated successfully!');

    // --- STEP 4: Dynamically schedule results processing 5 hours after the latest fixture ends ---
    try {
      // Extract latest fixture kickoff time from the fetched fixtures
      const fixtureTimes: number[] = Array.isArray(fixturesData?.response)
        ? fixturesData.response
            .map((item: any) => {
              const iso = item?.fixture?.date;
              const t = iso ? Date.parse(iso) : NaN;
              return Number.isFinite(t) ? t : NaN;
            })
            .filter((t: number) => Number.isFinite(t))
        : [];

      if (fixtureTimes.length > 0) {
        const latestKickoff = Math.max(...fixtureTimes);
        const latestKickoffISO = new Date(latestKickoff).toISOString();
        console.log('Latest fixture kickoff (UTC):', latestKickoffISO);

        // Schedule 5 hours after the latest kickoff
        const dynamicRunTime = new Date(latestKickoff + 5 * 60 * 60 * 1000);
        console.log('Calculated job time (UTC, +5h):', dynamicRunTime.toISOString());

        // Build a cron expression at the specific UTC minute/hour/day/month (one-time style)
        const cronExpr = `${dynamicRunTime.getUTCMinutes()} ${dynamicRunTime.getUTCHours()} ${dynamicRunTime.getUTCDate()} ${dynamicRunTime.getUTCMonth() + 1} *`;
        const jobName = `process-matchday-results-${Math.floor(dynamicRunTime.getTime() / 1000)}`;

        const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? 'https://jhsjszflscbpcfzuurwq.supabase.co';
        const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY');
        const scheduleUrl = `${SUPABASE_URL}/functions/v1/secure-run-process-matchday-results`;
        const authHeader = ANON_KEY ? `Bearer ${ANON_KEY}` : '';

        console.log(`Scheduling secure-run-process-matchday-results at ${dynamicRunTime.toISOString()} (cron: "${cronExpr}") with job name ${jobName}`);

        const { data: jobId, error: scheduleErr } = await supabaseAdmin.rpc('schedule_one_time_http_call', {
          job_name: jobName,
          schedule: cronExpr,
          url: scheduleUrl,
          auth_header: authHeader,
          body: JSON.stringify({ reason: 'auto-scheduled by update-football-cache', target_time: dynamicRunTime.toISOString() })
        });

        if (scheduleErr) {
          console.warn('Failed to schedule one-time results processing job:', scheduleErr.message);
        } else {
          console.log('One-time results processing job scheduled with id:', jobId);
        }
      } else {
        console.log('No valid fixture times found to schedule dynamic results processing.');
      }
    } catch (e) {
      console.warn('Dynamic scheduling encountered an issue (continuing):', (e as Error).message);
    }

    return new Response(JSON.stringify({ message: 'Cache updated successfully!', fixtures_found: fixtureIDs.length, odds_fetched: allOddsData.length }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('CRITICAL ERROR in Edge Function:', error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
