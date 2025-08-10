import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// League constant – easy to change
const leagueId = 40; // UK Championship

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
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => ({} as any));
    const jobName: string | undefined = body?.job_name;

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "https://jhsjszflscbpcfzuurwq.supabase.co";
    const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const API_FOOTBALL_KEY = Deno.env.get("API_FOOTBALL_KEY");

    if (!SERVICE_ROLE_KEY) throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY secret");
    if (!API_FOOTBALL_KEY) throw new Error("Missing API_FOOTBALL_KEY secret");

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
    if (finishedIds.length === 0) {
      return new Response(JSON.stringify({ ok: true, updated: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 2) Load pending bets for these fixtures
    const { data: bets, error: betsErr } = await sb
      .from("bets")
      .select("id,user_id,stake,odds,fixture_id,status,bet_selection")
      .in("fixture_id", finishedIds);
    if (betsErr) throw betsErr;

    const toUpdate: any[] = [];
    const wonUpdates: Array<{ user: string; delta: number }> = [];

    for (const b of bets ?? []) {
      if (!b || !b.fixture_id) continue;
      const currentStatus = (b.status ?? "pending").toLowerCase();
      if (currentStatus !== "pending") continue;

      const fr = resultsMap.get(Number(b.fixture_id));
      if (!fr) continue;

      const isWin = evaluateBet(b, fr);

      const stake = Number(b.stake ?? 0);
      const odds = Number(b.odds ?? 0);
      const payout = isWin ? stake * odds : 0;
      const net = isWin ? payout - stake : 0;

      toUpdate.push({ id: b.id, status: isWin ? "won" : "lost", payout });
      if (isWin) {
        wonUpdates.push({ user: b.user_id, delta: net });
      }
    }

    // 3) Persist bet updates and increment user points
    for (const u of toUpdate) {
      const { error: updErr } = await sb.from("bets").update({ status: u.status, payout: u.payout }).eq("id", u.id);
      if (updErr) throw updErr;
    }

    for (const w of wonUpdates) {
      const { error: incErr } = await sb.rpc("update_league_points", { user_id: w.user, points_to_add: w.delta });
      if (incErr) throw incErr;
    }

    // 4) Unschedule the one-time job if provided
    if (jobName) {
      await sb.rpc("unschedule_job", { job_name: jobName });
    }

    return new Response(JSON.stringify({ ok: true, updated: toUpdate.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("process-matchday-results error", e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});