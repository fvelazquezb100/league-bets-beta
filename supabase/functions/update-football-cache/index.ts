import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// League constant – easy to change
const leagueId = 40; // UK Championship

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "https://jhsjszflscbpcfzuurwq.supabase.co";
    const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const API_FOOTBALL_KEY = Deno.env.get("API_FOOTBALL_KEY");

    if (!SERVICE_ROLE_KEY) throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY secret");
    if (!API_FOOTBALL_KEY) throw new Error("Missing API_FOOTBALL_KEY secret");

    const sb = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
    console.log('Supabase admin client initialized.');

    const baseUrl = "https://v3.football.api-sports.io";

    console.log('API Key found. Starting two-step odds fetch...');

    // 1) Get next 10 upcoming fixtures for the league
    console.log(`Fetching fixtures from: ${baseUrl}/fixtures?league=${leagueId}&season=2025&next=10`);
    const fixturesRes = await fetch(`${baseUrl}/fixtures?league=${leagueId}&season=2025&next=10`, {
      headers: { "x-apisports-key": API_FOOTBALL_KEY },
    });
    if (!fixturesRes.ok) throw new Error(`Fixtures fetch failed: ${fixturesRes.status}`);
    const fixturesJson = await fixturesRes.json();
    const fixtures = fixturesJson?.response ?? [];

    console.log(`Found ${fixtures.length} upcoming fixtures.`);

    // 2) Fetch odds for each fixture
    const oddsList = await Promise.all(
      fixtures.map(async (fx: any) => {
        const id = fx?.fixture?.id;
        if (!id) return { fixtureId: null, odds: [] };
        
        console.log(`Fetching odds from: ${baseUrl}/odds?fixture=${id}`);
        const oddsRes = await fetch(`${baseUrl}/odds?fixture=${id}`, {
          headers: { "x-apisports-key": API_FOOTBALL_KEY },
        });
        const oddsJson = await oddsRes.json().catch(() => ({ response: [] }));
        return { fixtureId: id, odds: oddsJson?.response ?? [] };
      })
    );

    const oddsMap = new Map<number, any>();
    oddsList.forEach((o) => {
      if (o.fixtureId) oddsMap.set(o.fixtureId as number, o.odds);
    });

    // 3) Combine fixtures with odds in the expected format
    const combined = fixtures.map((fx: any) => {
      const fixtureOdds = oddsMap.get(fx?.fixture?.id) ?? [];
      return {
        fixture: fx.fixture,
        teams: fx.teams,
        league: fx.league,
        bookmakers: fixtureOdds.length > 0 ? fixtureOdds[0]?.bookmakers : []
      };
    });

    // 4) Store in match_odds_cache with response wrapper for compatibility
    const { error: upsertErr } = await sb
      .from("match_odds_cache")
      .upsert({ 
        id: 1, 
        data: { response: combined }, 
        last_updated: new Date().toISOString() 
      });
    if (upsertErr) throw upsertErr;

    console.log(`Successfully fetched odds for ${fixtures.length} matches.`);

    // 5) Schedule results processing 5 hours after the last fixture of this set
    if (fixtures.length > 0) {
      const lastDate = fixtures
        .map((f: any) => new Date(f?.fixture?.date))
        .filter((d: Date) => !isNaN(d.getTime()))
        .sort((a: Date, b: Date) => b.getTime() - a.getTime())[0];

      if (lastDate) {
        const runAt = new Date(lastDate.getTime() + 5 * 60 * 60 * 1000); // +5h
        const pad = (n: number) => n.toString().padStart(2, "0");
        const year = runAt.getUTCFullYear();
        const month = runAt.getUTCMonth() + 1;
        const day = runAt.getUTCDate();
        const hour = runAt.getUTCHours();
        const minute = runAt.getUTCMinutes();
        const cron = `${minute} ${hour} ${day} ${month} *`;
        const jobName = `process_results_${year}${pad(month)}${pad(day)}_${pad(hour)}${pad(minute)}`;

        const url = `${SUPABASE_URL}/functions/v1/secure-run-process-matchday-results`;
        const { data: jobId, error: schedErr } = await sb.rpc("schedule_one_time_http_call", {
          job_name: jobName,
          schedule: cron,
          url,
          auth_header: "", // public wrapper; no secrets here
          body: { job_name: jobName },
        });
        if (schedErr) throw schedErr;
      }
    }

    
    console.log('Cache updated successfully!');
    return new Response(JSON.stringify({ ok: true, fixtures: fixtures.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("update-football-cache error", e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});