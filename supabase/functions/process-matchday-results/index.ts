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
    for (const fx of finished) {
      const id = fx?.fixture?.id;
      const oc = outcomeFromFixture(fx);
      if (id && oc) outcomeMap.set(id, oc);
    }
    const finishedIds = Array.from(outcomeMap.keys());

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

      const oc = outcomeMap.get(Number(b.fixture_id));
      if (!oc) continue;

      const selection = String(b.bet_selection || "").toLowerCase().trim();
      const isWin =
        (selection.includes("home") && oc === "home") ||
        (selection.includes("away") && oc === "away") ||
        (selection.includes("draw") && oc === "draw");

      const stake = Number(b.stake ?? 0);
      const odds = Number(b.odds ?? 0);
      const payout = isWin ? stake * odds : 0;

      toUpdate.push({ id: b.id, status: isWin ? "won" : "lost", payout });
      if (isWin && payout > 0) {
        wonUpdates.push({ user: b.user_id, delta: payout });
      }
    }

    // 3) Persist bet updates and increment user points
    for (const u of toUpdate) {
      const { error: updErr } = await sb.from("bets").update({ status: u.status, payout: u.payout }).eq("id", u.id);
      if (updErr) throw updErr;
    }

    for (const w of wonUpdates) {
      const { error: incErr } = await sb.rpc("increment_user_points", { _user: w.user, _delta: w.delta });
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