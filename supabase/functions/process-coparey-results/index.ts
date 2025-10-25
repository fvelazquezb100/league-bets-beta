// @ts-ignore - Deno imports
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
// @ts-ignore - Deno imports
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type"
};

// Same evaluator as process-matchday-results but we will read fixtures from id=5/6 cache context if needed
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
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const API_KEY = Deno.env.get('API_FOOTBALL_KEY');
    const INTERNAL_SECRET = Deno.env.get('INTERNAL_FUNCTION_SECRET');
    const internalHeader = req.headers.get('x-internal-secret');
    if (!INTERNAL_SECRET || internalHeader !== INTERNAL_SECRET) {
      return new Response(JSON.stringify({ error: 'unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const sb = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    // Find fixtures to process from latest cached id=5 (Copa del Rey current)
    const { data: cacheRow } = await sb.from('match_odds_cache').select('data, last_updated').eq('id', 5).maybeSingle();
    const responseArr: any[] = (cacheRow?.data?.response && Array.isArray(cacheRow.data.response)) ? cacheRow.data.response : [];
    const fixtureIds: number[] = responseArr.map((it: any) => it?.fixture?.id).filter((n: any) => Number.isFinite(n));
    const fixturesUrl = `https://v3.football.api-sports.io/fixtures`;
    const results: any[] = [];
    for (const fxId of fixtureIds) {
      const url = `${fixturesUrl}?id=${fxId}`;
      const res = await fetch(url, { headers: { 'x-apisports-key': API_KEY } });
      if (!res.ok) continue;
      const json = await res.json().catch(() => null);
      const item = Array.isArray(json?.response) ? json.response[0] : null;
      if (item) results.push(item);
    }

    // Upsert into match_results table
    const upserts = results.map((r: any) => ({
      fixture_id: r?.fixture?.id,
      home_team: r?.teams?.home?.name,
      away_team: r?.teams?.away?.name,
      home_goals: r?.goals?.home ?? r?.score?.fulltime?.home ?? 0,
      away_goals: r?.goals?.away ?? r?.score?.fulltime?.away ?? 0,
      match_result: outcomeFromFixture(r)
    }));
    if (upserts.length > 0) {
      await sb.from('match_results').upsert(upserts, { onConflict: 'fixture_id', ignoreDuplicates: false });
    }

    return new Response(JSON.stringify({ ok: true, processed: upserts.length }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e?.message || e) }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});


