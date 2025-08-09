import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const leagues = [40, 140];
const season = 2025;
const bookmakerId = 8;
const marketsWanted = [
  "Match Winner",
  "Both Teams Score",
  "1st Half Winner",
  "Goals Over/Under",
  "Corners",
  "Red Card",
];

function getNextDates(days: number): string[] {
  const today = new Date();
  return Array.from({ length: days }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    return d.toISOString().split("T")[0];
  });
}

interface ApiValue { value?: string; odd?: string }
interface ApiBet { name?: string; values?: ApiValue[] }
interface ApiBookmaker { id?: number; bets?: ApiBet[] }
interface ApiFixture { id?: number; date?: string }
interface ApiLeague { id?: number; season?: number }
interface ApiTeam { name?: string }
interface ApiTeams { home?: ApiTeam; away?: ApiTeam }
interface ApiEvent {
  fixture?: ApiFixture;
  league?: ApiLeague;
  teams?: ApiTeams;
  bookmakers?: ApiBookmaker[];
}

function flattenBet(bet: ApiBet) {
  const obj: Record<string, string> = {};
  for (const v of bet?.values ?? []) {
    if (v?.value && v?.odd) obj[v.value] = v.odd;
  }
  return obj;
}

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
    const dates = getNextDates(3);
    const baseUrl = "https://v3.football.api-sports.io";

    const events: ApiEvent[] = [];

    for (const league of leagues) {
      for (const date of dates) {
        const url = `${baseUrl}/odds?league=${league}&season=${season}&date=${date}&bookmaker=${bookmakerId}`;
        const res = await fetch(url, {
          headers: { "x-apisports-key": API_FOOTBALL_KEY },
        });
        if (!res.ok) throw new Error(`Failed to fetch odds: ${res.status}`);
        const json = await res.json();
        if (Array.isArray(json.response)) {
          events.push(...(json.response as ApiEvent[]));
        }
        await new Promise((r) => setTimeout(r, 200));
      }
    }

    const flattened = events.map((ev) => {
      const bookmaker = ev.bookmakers?.find((b) => b.id === bookmakerId);
      const markets: Record<string, Record<string, string>> = {};
      for (const bet of bookmaker?.bets ?? []) {
        if (marketsWanted.includes(bet.name ?? "")) {
          markets[bet.name as string] = flattenBet(bet);
        }
      }
      return {
        id: ev?.fixture?.id,
        league_id: ev?.league?.id,
        season: ev?.league?.season,
        kickoff: ev?.fixture?.date,
        home_team: ev?.teams?.home?.name,
        away_team: ev?.teams?.away?.name,
        markets,
      };
    }).filter((e) => e.id);

    if (flattened.length > 0) {
      const { error } = await sb.from("events").upsert(flattened, { onConflict: "id" });
      if (error) throw error;
    }

    return new Response(JSON.stringify({ ok: true, upserted: flattened.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("refresh_odds error", e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

