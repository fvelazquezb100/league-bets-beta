import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// League constant – easy to change
const leagueId = 140; // La Liga

function outcomeFromFixture(fx: any): "home" | "away" | "draw" | null {
  try {
    const hg = fx?.goals?.home ?? fx?.score?.fulltime?.home ?? null;
    const ag = fx?.goals?.away ?? fx?.score?.fulltime?.away ?? null;
    if (hg == null || ag == null) return null;
    if (hg > ag) return "home";
    if (hg < ag) return "away";
    return "draw";
  } catch {
    return null;
  }
}

function evaluateBet(
  b: any,
  fr: { home_goals: number; away_goals: number; outcome: "home" | "away" | "draw" } | undefined,
): boolean {
  try {
    if (!b || !fr) return false;

    const sel = String(b.bet_selection || "").toLowerCase().trim();
    const hg = Number(fr.home_goals ?? 0);
    const ag = Number(fr.away_goals ?? 0);
    const total = hg + ag;

    // Both Teams To Score (BTTS)
    if ((sel.includes("both") && sel.includes("score")) || sel.includes("btts")) {
      const yes = sel.includes("yes");
      const no = sel.includes("no");
      const bothScored = hg > 0 && ag > 0;
      if (yes) return bothScored;
      if (no) return !bothScored;
      return false;
    }

    // Goals Over/Under
    if (sel.includes("over") || sel.includes("under") || /\b[ou]\s*\d/.test(sel)) {
      let threshold: number | null = null;
      let over = sel.includes("over");
      let under = sel.includes("under");

      const m1 = sel.match(/(over|under)\s*([0-9]+(?:\.[0-9]+)?)/);
      if (m1) {
        threshold = parseFloat(m1[2]);
        over = m1[1] === "over";
        under = m1[1] === "under";
      } else {
        const m2 = sel.match(/\b([ou])\s*([0-9]+(?:\.[0-9]+)?)/);
        if (m2) {
          threshold = parseFloat(m2[2]);
          over = m2[1] === "o";
          under = m2[1] === "u";
        }
      }

      if (threshold == null) return false;
      if (over) return total > threshold;
      if (under) return total < threshold;
    }

    // Match Winner (1X2)
    if (sel.includes("home")) return fr.outcome === "home";
    if (sel.includes("away")) return fr.outcome === "away";
    if (sel.includes("draw") || sel.includes("x")) return fr.outcome === "draw";

    return false;
  } catch {
    return false;
  }
}

serve(async (req) => {
  console.log('Protected function called');
  const startTime = Date.now();
  
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // 1. Validate Authorization header
    const authHeader = req.headers.get('Authorization');
    console.log('Authorization header present:', !!authHeader);
    
    if (!authHeader) {
      console.error('Missing Authorization header');
      return new Response(JSON.stringify({ 
        error: 'Unauthorized: Missing Authorization header',
        code: 'MISSING_AUTH'
      }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 2. Extract and validate JWT token
    const token = authHeader.replace('Bearer ', '');
    if (!token || !token.startsWith('eyJ')) {
      console.error('Invalid token format');
      return new Response(JSON.stringify({ 
        error: 'Unauthorized: Invalid token format',
        code: 'INVALID_TOKEN_FORMAT'
      }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 3. Verify this is a service_role token by checking environment
    const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!SERVICE_ROLE_KEY) {
      console.error('Missing SUPABASE_SERVICE_ROLE_KEY environment variable');
      return new Response(JSON.stringify({ 
        error: 'Server configuration error: Missing service role key',
        code: 'MISSING_SERVICE_KEY'
      }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 4. Verify the token matches our service role key
    if (token !== SERVICE_ROLE_KEY) {
      console.error('Token does not match service role key');
      return new Response(JSON.stringify({ 
        error: 'Unauthorized: Invalid service role token',
        code: 'INVALID_SERVICE_TOKEN'
      }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log('Service role authentication validated successfully');

    const body = await req.json().catch(() => ({} as any));
    const jobName: string | undefined = body?.job_name;
    console.log('Request body:', { jobName, trigger: body?.trigger, timestamp: body?.timestamp });

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "https://jhsjszflscbpcfzuurwq.supabase.co";
    const API_FOOTBALL_KEY = Deno.env.get("API_FOOTBALL_KEY");

    if (!API_FOOTBALL_KEY) {
      console.error('Missing API_FOOTBALL_KEY environment variable');
      return new Response(JSON.stringify({ 
        error: 'Server configuration error: Missing API Football key',
        code: 'MISSING_API_KEY'
      }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log('Creating Supabase client with service role key');
    const sb = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    // 1) Fetch recently finished fixtures for this league
    const baseUrl = "https://v3.football.api-sports.io";
    const finishedRes = await fetch(`${baseUrl}/fixtures?league=${leagueId}&status=FT&last=50`, {
      headers: { "x-apisports-key": API_FOOTBALL_KEY },
    });
    if (!finishedRes.ok) throw new Error(`Finished fixtures fetch failed: ${finishedRes.status}`);
    const finishedJson = await finishedRes.json();
    const finished = finishedJson?.response ?? [];

    const outcomeMap = new Map<number, "home" | "away" | "draw">();
    const resultsMap = new Map<number, { home_goals: number; away_goals: number; outcome: "home" | "away" | "draw" }>();
    for (const fx of finished) {
      const id = fx?.fixture?.id;
      const oc = outcomeFromFixture(fx);
      const hg = fx?.goals?.home ?? fx?.score?.fulltime?.home ?? null;
      const ag = fx?.goals?.away ?? fx?.score?.fulltime?.away ?? null;
      if (id && oc) outcomeMap.set(id, oc);
      if (id != null && hg != null && ag != null && oc) {
        resultsMap.set(id, { home_goals: Number(hg), away_goals: Number(ag), outcome: oc });
      }
    }
    
    const finishedIds = Array.from(resultsMap.keys());
    console.log(`Processing matchday results - found ${finishedIds.length} finished fixtures`);
    
    if (finishedIds.length === 0) {
      console.log('No finished fixtures found, returning early');
      const endTime = Date.now();
      return new Response(JSON.stringify({ 
        ok: true, 
        updated: 0,
        message: 'No finished fixtures found to process',
        timing: { totalMs: endTime - startTime }
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 2) Load pending bets for these fixtures
    const { data: bets, error: betsErr } = await sb
      .from("bets")
      .select("id,user_id,stake,odds,fixture_id,status,bet_selection,bet_type")
      .in("fixture_id", finishedIds);
    if (betsErr) throw betsErr;

    // 3) Load pending bet selections for these fixtures
    const { data: betSelections, error: selectionsErr } = await sb
      .from("bet_selections")
      .select("id,bet_id,fixture_id,market,selection,odds,status")
      .in("fixture_id", finishedIds)
      .eq("status", "pending");
    if (selectionsErr) throw selectionsErr;

    const toUpdate: any[] = [];
    const wonUpdates: Array<{ user: string; delta: number }> = [];
    const selectionsToUpdate: any[] = [];
    const affectedComboBets = new Set<number>();

    // Process single bets (existing logic)
    for (const b of bets ?? []) {
      if (!b || !b.fixture_id) continue;
      const currentStatus = (b.status ?? "pending").toLowerCase();
      if (currentStatus !== "pending") continue;
      
      // Skip combo bets - they will be handled separately
      if (b.bet_type === 'combo') continue;

      const fr = resultsMap.get(Number(b.fixture_id));
      if (!fr) continue;

      const isWin = evaluateBet(b, fr);

      const stake = Number(b.stake ?? 0);
      const odds = Number(b.odds ?? 0);
      const payout = isWin ? stake * odds : 0;
      const net = isWin ? payout - stake : 0;

      toUpdate.push({ id: b.id, status: isWin ? "won" : "lost", payout });
      if (isWin) {
        wonUpdates.push({ user: b.user_id, delta: payout });
      }
    }

    // Process individual bet selections for combo bets
    for (const bs of betSelections ?? []) {
      if (!bs || !bs.fixture_id) continue;
      
      const fr = resultsMap.get(Number(bs.fixture_id));
      if (!fr) continue;

      // Create a mock bet object to use evaluateBet function
      const mockBet = {
        bet_selection: bs.selection,
        fixture_id: bs.fixture_id
      };

      const isWin = evaluateBet(mockBet, fr);
      const newStatus = isWin ? "won" : "lost";

      selectionsToUpdate.push({ 
        id: bs.id, 
        status: newStatus 
      });
      
      // Track which combo bets are affected
      affectedComboBets.add(bs.bet_id);
    }

    // 4) Persist single bet updates and increment user points
    for (const u of toUpdate) {
      const { error: updErr } = await sb.from("bets").update({ status: u.status, payout: u.payout }).eq("id", u.id);
      if (updErr) throw updErr;
    }

    for (const w of wonUpdates) {
      const { error: incErr } = await sb.rpc("update_league_points", { user_id: w.user, points_to_add: w.delta });
      if (incErr) throw incErr;
    }

    // 5) Update bet selections
    for (const s of selectionsToUpdate) {
      const { error: selUpdErr } = await sb.from("bet_selections").update({ status: s.status }).eq("id", s.id);
      if (selUpdErr) throw selUpdErr;
    }

    // 6) Update combo bet statuses
    for (const comboBetId of Array.from(affectedComboBets)) {
      const { error: comboErr } = await sb.rpc("update_combo_bet_status", { bet_id_to_check: comboBetId });
      if (comboErr) {
        console.error(`Error updating combo bet ${comboBetId}:`, comboErr);
        // Continue processing other combo bets even if one fails
      }
    }

    // 7) Unschedule the one-time job if provided
    if (jobName) {
      console.log(`Unscheduling job: ${jobName}`);
      await sb.rpc("unschedule_job", { job_name: jobName });
    }

    const totalUpdated = toUpdate.length + selectionsToUpdate.length;
    const endTime = Date.now();
    const processingTime = endTime - startTime;
    
    console.log(`Processing completed successfully:`, {
      totalUpdated,
      singleBets: toUpdate.length,
      selections: selectionsToUpdate.length,
      comboBets: affectedComboBets.size,
      processingTimeMs: processingTime
    });
    
    return new Response(JSON.stringify({ 
      ok: true, 
      updated: totalUpdated,
      singleBets: toUpdate.length,
      selections: selectionsToUpdate.length,
      comboBets: affectedComboBets.size,
      timing: { totalMs: processingTime },
      message: `Successfully processed ${totalUpdated} bet updates`
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    const endTime = Date.now();
    const processingTime = endTime - startTime;
    
    console.error("=== PROCESS MATCHDAY RESULTS ERROR ===");
    console.error("Error message:", e?.message || String(e));
    console.error("Error stack:", e?.stack);
    console.error("Processing time before error:", processingTime, "ms");
    
    const errorResponse = {
      error: 'Failed to process matchday results',
      details: e?.message || String(e),
      code: 'PROCESSING_ERROR',
      timing: { totalMs: processingTime }
    };
    
    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});