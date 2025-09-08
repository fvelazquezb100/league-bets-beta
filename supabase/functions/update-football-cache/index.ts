import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-api-version, x-internal-secret',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
}

// Helper function to add a delay between API calls to respect rate limits
const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    console.log('Protected function called');
    
    // Get internal secret for authentication
    const INTERNAL_SECRET = Deno.env.get('INTERNAL_FUNCTION_SECRET');
    const authHeaderSecret = req.headers.get('x-internal-secret');
    
    let requestBody;
    try {
      requestBody = await req.json();
    } catch {
      requestBody = {};
    }
    const bodySecret = requestBody?.internal_secret;
    
    console.log('Internal secret from body present:', !!bodySecret);
    console.log('Internal secret from header present:', !!authHeaderSecret);
    
    // Validate internal secret
    if (!INTERNAL_SECRET || (authHeaderSecret !== INTERNAL_SECRET && bodySecret !== INTERNAL_SECRET)) {
      console.log('Internal secret authentication failed');
      return new Response(JSON.stringify({ 
        error: 'Unauthorized - Invalid internal secret',
        bodySecretPresent: !!bodySecret,
        headerSecretPresent: !!authHeaderSecret,
        internalSecretConfigured: !!INTERNAL_SECRET
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    console.log('Internal secret authentication validated successfully');
    
    // Validate environment variables
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const API_KEY = Deno.env.get('API_FOOTBALL_KEY');
    
    console.log('SERVICE_ROLE_KEY present:', !!SERVICE_ROLE_KEY);
    
    if (!SUPABASE_URL || !SERVICE_ROLE_KEY || !API_KEY) {
      return new Response(JSON.stringify({ 
        error: 'Missing required environment variables',
        missing: {
          SUPABASE_URL: !SUPABASE_URL,
          SERVICE_ROLE_KEY: !SERVICE_ROLE_KEY,
          API_FOOTBALL_KEY: !API_KEY
        }
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    console.log('Creating Supabase client with service role key');
    
    // Initialize Supabase client
    const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
    console.log("Supabase admin client initialized.");

    console.log('API Key found. Starting two-step odds fetch...');

    // --- STEP 1: Fetch the NEXT 10 upcoming fixture IDs for all leagues ---
    const leagueIds = [140, 2, 3]; // La Liga, Champions League, Europa League
    const currentYear = new Date().getFullYear();
    
    let allFixtureIDs: number[] = [];
    let allTeamsByFixture = new Map<number, any>();
    let allFixturesData: any[] = [];
    
    for (const leagueId of leagueIds) {
      const leagueName = leagueId === 140 ? 'La Liga' : 
                        leagueId === 2 ? 'Champions League' : 'Europa League'; 
      const fixturesUrl = `https://v3.football.api-sports.io/fixtures?league=${leagueId}&season=${currentYear}&next=10`;
      console.log(`Fetching fixtures from ${leagueName}: ${fixturesUrl}`);
      
      const fixturesResponse = await fetch(fixturesUrl, {
        headers: {
          'x-apisports-key': API_KEY,
        },
      });

      if (!fixturesResponse.ok) {
        console.warn(`Failed to fetch fixtures for league ${leagueId}: ${await fixturesResponse.text()}`);
        continue; // Skip this league and continue with others
      }

      const fixturesData = await fixturesResponse.json();
      const fixtureIDs: number[] = fixturesData.response.map((item: any) => item.fixture.id);
      
      // Store teams info and league info for this league
      fixturesData.response.forEach((item: any) => {
        if (item?.fixture?.id && item?.teams) {
          allTeamsByFixture.set(item.fixture.id, {
            ...item.teams,
            league_id: leagueId,
            league_name: leagueName
          });
        }
      });
      
      allFixtureIDs.push(...fixtureIDs);
      allFixturesData.push(...fixturesData.response);
      
      console.log(`Found ${fixtureIDs.length} upcoming fixtures for ${leagueName}.`);
      await delay(200); // Small delay between league requests
    }
    
    console.log(`Total fixtures found across all leagues: ${allFixtureIDs.length}`);
    if (allFixtureIDs.length === 0) {
      console.log('No upcoming fixtures found. Cache will not be updated.');
       return new Response(JSON.stringify({ message: 'No upcoming fixtures to fetch odds for.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    // --- STEP 2: Fetch odds for each of those fixture IDs ---
    const allOddsData = [];
    for (const fixtureId of allFixtureIDs) {
      const oddsUrl = `https://v3.football.api-sports.io/odds?fixture=${fixtureId}`;
      console.log(`Fetching odds from: ${oddsUrl}`);
      const oddsResponse = await fetch(oddsUrl, {
        headers: {
          'x-apisports-key': API_KEY,
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
      const teams = fxId ? allTeamsByFixture.get(fxId) : null;
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
      const fixtureTimes: number[] = Array.isArray(allFixturesData)
        ? allFixturesData
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

        const SUPABASE_URL_FOR_SCHEDULE = Deno.env.get('SUPABASE_URL');
        const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY');
        const scheduleUrl = `${SUPABASE_URL_FOR_SCHEDULE}/functions/v1/secure-run-process-matchday-results`;
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

    return new Response(JSON.stringify({ 
      message: 'Cache updated successfully!', 
      leagues_processed: leagueIds.length,
      fixtures_found: allFixtureIDs.length, 
      odds_fetched: allOddsData.length 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('CRITICAL ERROR in Edge Function:', error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});