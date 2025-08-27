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
  fr: { 
    home_goals: number; 
    away_goals: number; 
    outcome: "home" | "away" | "draw";
    halftime_home?: number;
    halftime_away?: number;
    halftime_outcome?: "home" | "away" | "draw";
  } | undefined,
): boolean {
  try {
    if (!b || !fr) return false;

    const sel = String(b.bet_selection || "").toLowerCase().trim();
    const hg = Number(fr.home_goals ?? 0);
    const ag = Number(fr.away_goals ?? 0);
    const total = hg + ag;

    // Double Chance bets
    if (sel.includes("1x") || sel.includes("local o empate")) {
      return fr.outcome === "home" || fr.outcome === "draw";
    }
    if (sel.includes("x2") || sel.includes("empate o visitante")) {
      return fr.outcome === "draw" || fr.outcome === "away";
    }
    if (sel.includes("12") || sel.includes("local o visitante")) {
      return fr.outcome === "home" || fr.outcome === "away";
    }

    // Correct Score bets
    if (sel.includes("-") && /\d+-\d+/.test(sel)) {
      const scoreMatch = sel.match(/(\d+)-(\d+)/);
      if (scoreMatch) {
        const expectedHome = parseInt(scoreMatch[1]);
        const expectedAway = parseInt(scoreMatch[2]);
        return hg === expectedHome && ag === expectedAway;
      }
    }

    // First Half Winner bets (if halftime data available)
    if ((sel.includes("1st") || sel.includes("first") || sel.includes("1ª")) && sel.includes("half")) {
      if (fr.halftime_outcome) {
        if (sel.includes("home") || sel.includes("local")) return fr.halftime_outcome === "home";
        if (sel.includes("away") || sel.includes("visitante")) return fr.halftime_outcome === "away";
        if (sel.includes("draw") || sel.includes("empate")) return fr.halftime_outcome === "draw";
      }
      // If no halftime data, cannot evaluate - return false for now
      return false;
    }

    // Second Half Winner bets (requires calculation from full-time and halftime)
    if ((sel.includes("2nd") || sel.includes("second") || sel.includes("2ª")) && sel.includes("half")) {
      if (fr.halftime_home !== undefined && fr.halftime_away !== undefined) {
        const secondHalfHome = hg - fr.halftime_home;
        const secondHalfAway = ag - fr.halftime_away;
        
        if (sel.includes("home") || sel.includes("local")) {
          return secondHalfHome > secondHalfAway;
        }
        if (sel.includes("away") || sel.includes("visitante")) {
          return secondHalfHome < secondHalfAway;
        }
        if (sel.includes("draw") || sel.includes("empate")) {
          return secondHalfHome === secondHalfAway;
        }
      }
      return false;
    }

    // HT/FT Double bets
    if (sel.includes("/")) {
      const parts = sel.split("/");
      if (parts.length === 2 && fr.halftime_outcome) {
        const htPart = parts[0].trim();
        const ftPart = parts[1].trim();
        
        let htCorrect = false;
        let ftCorrect = false;
        
        // Check halftime outcome
        if (htPart.includes("home") || htPart.includes("local")) {
          htCorrect = fr.halftime_outcome === "home";
        } else if (htPart.includes("away") || htPart.includes("visitante")) {
          htCorrect = fr.halftime_outcome === "away";
        } else if (htPart.includes("draw") || htPart.includes("empate")) {
          htCorrect = fr.halftime_outcome === "draw";
        }
        
        // Check full-time outcome
        if (ftPart.includes("home") || ftPart.includes("local")) {
          ftCorrect = fr.outcome === "home";
        } else if (ftPart.includes("away") || ftPart.includes("visitante")) {
          ftCorrect = fr.outcome === "away";
        } else if (ftPart.includes("draw") || ftPart.includes("empate")) {
          ftCorrect = fr.outcome === "draw";
        }
        
        return htCorrect && ftCorrect;
      }
    }

    // Result + Over/Under combinations
    if (sel.includes("&") || sel.includes("and")) {
      const parts = sel.split(/[&]|and/).map(p => p.trim());
      if (parts.length === 2) {
        const resultPart = parts[0];
        const overUnderPart = parts[1];
        
        let resultCorrect = false;
        let overUnderCorrect = false;
        
        // Check result part
        if (resultPart.includes("home") || resultPart.includes("local")) {
          resultCorrect = fr.outcome === "home";
        } else if (resultPart.includes("away") || resultPart.includes("visitante")) {
          resultCorrect = fr.outcome === "away";
        } else if (resultPart.includes("draw") || resultPart.includes("empate")) {
          resultCorrect = fr.outcome === "draw";
        }
        
        // Check over/under part
        if (overUnderPart.includes("over") || overUnderPart.includes("más")) {
          const thresholdMatch = overUnderPart.match(/([0-9]+(?:\.[0-9]+)?)/);
          if (thresholdMatch) {
            const threshold = parseFloat(thresholdMatch[1]);
            overUnderCorrect = total > threshold;
          }
        } else if (overUnderPart.includes("under") || overUnderPart.includes("menos")) {
          const thresholdMatch = overUnderPart.match(/([0-9]+(?:\.[0-9]+)?)/);
          if (thresholdMatch) {
            const threshold = parseFloat(thresholdMatch[1]);
            overUnderCorrect = total < threshold;
          }
        } else if (overUnderPart.includes("yes") || overUnderPart.includes("sí")) {
          overUnderCorrect = hg > 0 && ag > 0;
        } else if (overUnderPart.includes("no")) {
          overUnderCorrect = !(hg > 0 && ag > 0);
        }
        
        return resultCorrect && overUnderCorrect;
      }
    }

    // Both Teams To Score (BTTS)
    if ((sel.includes("both") && sel.includes("score")) || sel.includes("btts") || 
        sel.includes("ambos") || sel.includes("marcan")) {
      const yes = sel.includes("yes") || sel.includes("sí");
      const no = sel.includes("no");
      const bothScored = hg > 0 && ag > 0;
      if (yes) return bothScored;
      if (no) return !bothScored;
      return false;
    }

    // Goals Over/Under
    if (sel.includes("over") || sel.includes("under") || sel.includes("más") || 
        sel.includes("menos") || /\b[ou]\s*\d/.test(sel)) {
      let threshold: number | null = null;
      let over = sel.includes("over") || sel.includes("más");
      let under = sel.includes("under") || sel.includes("menos");

      const m1 = sel.match(/(over|under|más|menos)\s*(?:de\s*)?([0-9]+(?:\.[0-9]+)?)/);
      if (m1) {
        threshold = parseFloat(m1[2]);
        over = m1[1] === "over" || m1[1] === "más";
        under = m1[1] === "under" || m1[1] === "menos";
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
    if (sel.includes("home") || sel.includes("local")) return fr.outcome === "home";
    if (sel.includes("away") || sel.includes("visitante")) return fr.outcome === "away";
    if (sel.includes("draw") || sel.includes("empate") || sel.includes("x")) return fr.outcome === "draw";

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
    // Validate internal secret from secure wrapper (no JWT needed since function is public)
    // Prefer header (works even if body is stripped), fallback to body
    const headerSecret = req.headers.get('x-internal-secret')
      || (req.headers.get('authorization')?.replace(/^Bearer\s+/i, '').trim() || undefined);
    const body = await req.json().catch(() => ({} as any));
    const bodySecret = body?.internal_secret;
    const internalSecret = headerSecret || bodySecret;
    const expectedSecret = Deno.env.get("INTERNAL_EDGE_SECRET");
    
    if (!expectedSecret) {
      console.error('Missing INTERNAL_EDGE_SECRET environment variable');
      return new Response(JSON.stringify({ 
        error: 'Server configuration error: Missing internal secret',
        code: 'MISSING_INTERNAL_SECRET'
      }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (internalSecret !== expectedSecret) {
      console.error('Invalid internal secret');
      return new Response(JSON.stringify({ 
        error: 'Unauthorized: Invalid internal secret',
        code: 'INVALID_INTERNAL_SECRET'
      }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log('Internal secret validation successful');

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
    const resultsMap = new Map<number, { 
      home_goals: number; 
      away_goals: number; 
      outcome: "home" | "away" | "draw";
      halftime_home?: number;
      halftime_away?: number;
      halftime_outcome?: "home" | "away" | "draw";
    }>();
    
    for (const fx of finished) {
      const id = fx?.fixture?.id;
      const oc = outcomeFromFixture(fx);
      const hg = fx?.goals?.home ?? fx?.score?.fulltime?.home ?? null;
      const ag = fx?.goals?.away ?? fx?.score?.fulltime?.away ?? null;
      
      // Extract halftime scores if available
      const htHome = fx?.score?.halftime?.home ?? null;
      const htAway = fx?.score?.halftime?.away ?? null;
      let htOutcome: "home" | "away" | "draw" | undefined = undefined;
      
      if (htHome !== null && htAway !== null) {
        if (htHome > htAway) htOutcome = "home";
        else if (htHome < htAway) htOutcome = "away";
        else htOutcome = "draw";
      }
      
      if (id && oc) outcomeMap.set(id, oc);
      if (id != null && hg != null && ag != null && oc) {
        resultsMap.set(id, { 
          home_goals: Number(hg), 
          away_goals: Number(ag), 
          outcome: oc,
          halftime_home: htHome !== null ? Number(htHome) : undefined,
          halftime_away: htAway !== null ? Number(htAway) : undefined,
          halftime_outcome: htOutcome
        });
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
      .select("id,user_id,stake,odds,fixture_id,status,bet_selection,bet_type,market_bets")
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

    // Process single bets (fixed logic to parse bet_selection properly)
    for (const b of bets ?? []) {
      if (!b || !b.fixture_id) continue;
      const currentStatus = (b.status ?? "pending").toLowerCase();
      if (currentStatus !== "pending") continue;
      
      // Skip combo bets - they will be handled separately
      if (b.bet_type === 'combo') continue;

      const fr = resultsMap.get(Number(b.fixture_id));
      if (!fr) continue;

      // Parse bet_selection to extract clean selection text
      // Format is typically "Under 2.5 @ 1.7" so we want just "Under 2.5"
      let cleanSelection = b.bet_selection;
      if (cleanSelection && cleanSelection.includes(' @ ')) {
        const parts = cleanSelection.split(' @ ');
        cleanSelection = parts[0].trim();
      }

      console.log(`Processing single bet ${b.id}:`, {
        original_bet_selection: b.bet_selection,
        cleaned_selection: cleanSelection,
        market_bets: b.market_bets,
        fixture_id: b.fixture_id,
        match_result: fr
      });

      // Create a proper bet object for evaluation with clean selection
      const betForEvaluation = {
        bet_selection: cleanSelection,
        fixture_id: b.fixture_id,
        market_bets: b.market_bets
      };

      const isWin = evaluateBet(betForEvaluation, fr);

      console.log(`Single bet ${b.id} evaluation result: ${isWin ? 'WON' : 'LOST'}`);

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