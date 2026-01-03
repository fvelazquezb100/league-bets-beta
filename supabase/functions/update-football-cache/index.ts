// @ts-ignore - Deno imports
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// @ts-ignore - Deno global
declare const Deno: any;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-api-version, x-internal-secret',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
}

// Helper function to add a delay between API calls to respect rate limits
const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

// Helper function to get the correct season year
// For European football seasons (Aug-Jul), if we're in Jan-Jul, use previous year
const getSeasonYear = () => {
  const now = new Date();
  const currentMonth = now.getMonth() + 1; // getMonth() returns 0-11
  const currentYear = now.getFullYear();
  
  // If between January (1) and July (7), use previous year
  // If between August (8) and December (12), use current year
  return currentMonth >= 8 ? currentYear : currentYear - 1;
};

// Helper function to make API requests with timeout
const fetchWithTimeout = async (url: string, options: RequestInit, timeoutMs: number = 10000) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error(`Request timeout after ${timeoutMs}ms`);
    }
    throw error;
  }
};

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

    // --- STEP 1: Fetch upcoming fixture IDs for all leagues (10 for La Liga/Liga MX, 18 for Champions/Europa) ---
    const leagueIds = [140, 2, 3, 262]; // La Liga, Champions League, Europa League, Liga MX
    const currentYear = getSeasonYear();
    console.log(`Using season year: ${currentYear} (current date: ${new Date().toISOString()})`);
    
    let allFixtureIDs: number[] = [];
    let allTeamsByFixture = new Map<number, any>();
    let allFixturesData: any[] = [];
    
    for (const leagueId of leagueIds) {
      const leagueName = leagueId === 140 ? 'La Liga' : 
                        leagueId === 2 ? 'Champions League' : 
                        leagueId === 3 ? 'Europa League' : 'Liga MX';
      
      // Define number of matches per league
      const matchesPerLeague = leagueId === 140 ? 10 :  // La Liga: 10 partidos
                              leagueId === 262 ? 10 :  // Liga MX: 10 partidos
                              leagueId === 2 ? 18 :    // Champions League: 18 partidos
                              18;                      // Europa League: 18 partidos
      
      const fixturesUrl = `https://v3.football.api-sports.io/fixtures?league=${leagueId}&season=${currentYear}&next=${matchesPerLeague}`;
      console.log(`Fetching ${matchesPerLeague} fixtures from ${leagueName}: ${fixturesUrl}`);
      
      const fixturesResponse = await fetchWithTimeout(fixturesUrl, {
        headers: {
          'x-apisports-key': API_KEY,
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept': 'application/json',
          'Accept-Language': 'en-US,en;q=0.9',
          'Cache-Control': 'no-cache',
        },
      }, 15000); // 15 second timeout for fixtures

      if (!fixturesResponse.ok) {
        let errorText = '';
        try {
          errorText = await fixturesResponse.text();
        } catch (e) {
          errorText = 'Could not read error response';
        }
        console.warn(`Failed to fetch fixtures for league ${leagueId}: Status ${fixturesResponse.status} - ${errorText}`);
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
      console.log(`Fixture IDs for ${leagueName}:`, fixtureIDs.slice(0, 5)); // Log first 5 fixture IDs
      await delay(1000); // Increased delay between league requests to avoid blocking
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
    const allOddsData: any[] = [];
    let oddsSuccessCount = 0;
    let oddsFailureCount = 0;
    
    for (const fixtureId of allFixtureIDs) {
      const oddsUrl = `https://v3.football.api-sports.io/odds?fixture=${fixtureId}`;
      console.log(`Fetching odds from: ${oddsUrl}`);
      
      try {
        const oddsResponse = await fetchWithTimeout(oddsUrl, {
          headers: {
            'x-apisports-key': API_KEY,
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept': 'application/json',
            'Accept-Language': 'en-US,en;q=0.9',
            'Cache-Control': 'no-cache',
          },
        }, 20000); // 20 second timeout for odds

        if (oddsResponse.ok) {
        const oddsJson = await oddsResponse.json();
        if (oddsJson.response && oddsJson.response.length > 0) {
            allOddsData.push(...oddsJson.response);
            oddsSuccessCount++;
            console.log(`✅ Successfully fetched odds for fixture ${fixtureId} (${oddsJson.response.length} bookmakers)`);
        } else {
          // For European competitions, it's normal to not have odds immediately
          const teams = allTeamsByFixture.get(fixtureId);
          const leagueName = teams?.league_name || 'Unknown';
          if (leagueName === 'Champions League' || leagueName === 'Europa League') {
            console.log(`ℹ️ No odds yet for ${leagueName} fixture ${fixtureId} (normal for European competitions)`);
          } else {
            console.warn(`⚠️ No odds data found for fixture ${fixtureId}`);
          }
          oddsFailureCount++;
        }
      } else {
        let errorText = '';
        try {
          errorText = await oddsResponse.text();
        } catch (e) {
          errorText = 'Could not read error response';
        }
          console.warn(`❌ Could not fetch odds for fixture ${fixtureId}: Status ${oddsResponse.status} - ${errorText}`);
          oddsFailureCount++;
        }
      } catch (error) {
        console.error(`❌ Exception fetching odds for fixture ${fixtureId}:`, error.message);
        oddsFailureCount++;
      }
      await delay(1000); // Increased delay to avoid Cloudflare blocking
    }
    
    console.log(`Odds fetch summary: ${oddsSuccessCount} successful, ${oddsFailureCount} failed`);

    // Create placeholder entries for fixtures without odds (especially European competitions)
    const fixturesWithoutOdds = allFixtureIDs.filter(fixtureId => 
      !allOddsData.some(odds => odds.fixture?.id === fixtureId)
    );
    
    console.log(`Creating placeholder entries for ${fixturesWithoutOdds.length} fixtures without odds`);
    
    fixturesWithoutOdds.forEach(fixtureId => {
      const teams = allTeamsByFixture.get(fixtureId);
      if (teams) {
        // Find the original fixture data to get the date
        const originalFixture = allFixturesData.find(f => f?.fixture?.id === fixtureId);
        const fixtureDate = originalFixture?.fixture?.date || null;
        
        // Create a minimal placeholder entry with date
        const placeholderEntry = {
          fixture: { 
            id: fixtureId,
            date: fixtureDate
          },
          teams: teams,
          bookmakers: [] // Empty bookmakers array
        };
        allOddsData.push(placeholderEntry);
        console.log(`📝 Created placeholder for ${teams.league_name} fixture ${fixtureId} with date: ${fixtureDate}`);
      }
    });

    console.log(`Total matches in cache (including placeholders): ${allOddsData.length}`);

    // --- STEP 3: Upsert the cache ---
    const mergedOdds = allOddsData.map((entry: any) => {
      const fxId = entry?.fixture?.id;
      const teams = fxId ? allTeamsByFixture.get(fxId) : null;
      return teams ? { ...entry, teams } : entry;
    });
    
    // Log league distribution in final cache
    const leagueDistribution = mergedOdds.reduce((acc, match) => {
      const leagueId = match.teams?.league_id;
      const leagueName = match.teams?.league_name || 'Unknown';
      acc[leagueName] = (acc[leagueName] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    console.log('Final cache league distribution:', leagueDistribution);
    console.log(`Total matches in final cache: ${mergedOdds.length}`);
    
    const finalCacheObject = { response: mergedOdds };

    // Before writing current (id=1), copy existing id=1 data AND date to id=2 (previous)
    try {
      const { data: currentRow } = await supabaseAdmin
        .from('match_odds_cache')
        .select('data, last_updated')
        .eq('id', 1)
        .maybeSingle();
      if (currentRow && currentRow.data) {
        await supabaseAdmin
          .from('match_odds_cache')
          .upsert({
            id: 2,
            data: currentRow.data,
            info: 'Leagues - previous odds snapshot',
            last_updated: currentRow.last_updated, // Copy the date from current row
          });
      }
    } catch (e) {
      console.warn('Could not copy leagues current (id=1) to previous (id=2):', (e as Error).message);
    }

    const { error: upsertError } = await supabaseAdmin
      .from('match_odds_cache')
      .upsert({
        id: 1,
        data: finalCacheObject,
        info: 'Leagues - current odds snapshot',
        last_updated: new Date().toISOString(),
      });

    if (upsertError) {
      throw new Error(`Failed to upsert cache: ${upsertError.message}`);
    }
    
    console.log('Cache updated successfully!');

    // --- STEP 4: Create/update match_results entries with kickoff_time ---
    console.log('Creating/updating match_results entries with kickoff times...');
    
    const matchResultsUpserts = allFixturesData
      .filter(fixture => fixture?.fixture?.id && fixture?.fixture?.date && fixture?.teams)
      .map(fixture => ({
        fixture_id: fixture.fixture.id,
        kickoff_time: fixture.fixture.date,
        home_team: fixture.teams.home.name,
        away_team: fixture.teams.away.name,
        // Don't overwrite existing result data, only set kickoff_time and team names
      }));
    
    console.log(`Upserting ${matchResultsUpserts.length} match_results entries with kickoff times`);
    
    if (matchResultsUpserts.length > 0) {
      // Use upsert with onConflict to only update kickoff_time if the record doesn't exist
      // or if kickoff_time is null
      const { error: matchResultsError } = await supabaseAdmin
        .from('match_results')
        .upsert(matchResultsUpserts, { 
          onConflict: 'fixture_id',
          ignoreDuplicates: false 
        });

      if (matchResultsError) {
        console.warn('Failed to upsert match_results entries:', matchResultsError.message);
      } else {
        console.log('Successfully created/updated match_results entries with kickoff times');
      }
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