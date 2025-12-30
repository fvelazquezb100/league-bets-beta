// @ts-ignore - Deno imports
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
// @ts-ignore - Deno imports
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// League constants – easy to change
const leagueIds = [143, 32]; // Copa del Rey, Clasificación Europea Mundial

function outcomeFromFixture(fx: any): "home" | "away" | "draw" | null {
  try {
    const status = fx?.fixture?.status?.short;
    const customStatus = fx?.match_status;
    const matchStatus = normalizeMatchStatus(customStatus || status);
    const matchId = fx?.fixture?.id;

    const fullTimeHome = fx?.score?.fulltime?.home ?? null;
    const fullTimeAway = fx?.score?.fulltime?.away ?? null;
    const goalsHome = fx?.goals?.home ?? null;
    const goalsAway = fx?.goals?.away ?? null;

    const regulationHome = fullTimeHome ?? goalsHome ?? null;
    const regulationAway = fullTimeAway ?? goalsAway ?? null;

    if (regulationHome == null || regulationAway == null) return null;

    if (matchStatus === 'AET' || matchStatus === 'PEN') {
      const finalHome = goalsHome ?? regulationHome;
      const finalAway = goalsAway ?? regulationAway;
      console.log(`Match ${matchId} ended in ${matchStatus === 'AET' ? 'extra time' : 'penalties'}, regulation ${regulationHome}-${regulationAway}, final ${finalHome}-${finalAway}`);
    }

    if (regulationHome > regulationAway) return "home";
    if (regulationHome < regulationAway) return "away";
    return "draw";
  } catch {
    return null;
  }
}

function normalizeMatchStatus(status: string | null | undefined): "FT" | "AET" | "PEN" | null {
  if (!status) return null;
  const normalized = status.toUpperCase();
  if (normalized === "FT" || normalized === "AET" || normalized === "PEN") {
    return normalized;
  }
  return null;
}

function formatScore(home: number | null | undefined, away: number | null | undefined): string | null {
  if (home === null || home === undefined) return null;
  if (away === null || away === undefined) return null;
  if (Number.isNaN(Number(home)) || Number.isNaN(Number(away))) return null;
  return `${Number(home)}-${Number(away)}`;
}

function formatExtendedMatchResult(params: {
  status: "FT" | "AET" | "PEN" | null;
  totalHome: number | null | undefined;
  totalAway: number | null | undefined;
  fullTimeHome: number | null | undefined;
  fullTimeAway: number | null | undefined;
  extraTimeHome: number | null | undefined;
  extraTimeAway: number | null | undefined;
  penaltyHome: number | null | undefined;
  penaltyAway: number | null | undefined;
}): string | null {
  const finalScore = formatScore(params.totalHome, params.totalAway);
  const fullTimeScore = formatScore(params.fullTimeHome, params.fullTimeAway);
  const extraTimeScore = formatScore(params.extraTimeHome, params.extraTimeAway);
  const penaltyScore = formatScore(params.penaltyHome, params.penaltyAway);

  if (!params.status || params.status === "FT") {
    return finalScore || fullTimeScore;
  }

  if (params.status === "AET") {
    if (fullTimeScore && finalScore) {
      return `${fullTimeScore} | ${finalScore} AET`;
    }
    if (fullTimeScore) {
      return `${fullTimeScore} | AET`;
    }
    if (finalScore) {
      return `${finalScore} AET`;
    }
    return `AET`;
  }

  if (params.status === "PEN") {
    if (fullTimeScore && finalScore && penaltyScore) {
      const base = `${fullTimeScore} | ${finalScore} AET`;
      return `${base} (${penaltyScore})`;
    }
    if (finalScore && penaltyScore) {
      return `${finalScore} AET (${penaltyScore})`;
    }
    if (penaltyScore) {
      return `PEN (${penaltyScore})`;
    }
    return `PEN`;
  }

  return finalScore || fullTimeScore;
}

function computeFinalGoals(params: {
  regulation: number | null;
  finalGoals: number | null;
  extraTime: number | null;
  status: "FT" | "AET" | "PEN" | null;
}): number | null {
  const { regulation, finalGoals, extraTime, status } = params;

  if (status === "AET" && extraTime != null) {
    const extraTotal = regulation != null && extraTime < regulation
      ? regulation + extraTime
      : extraTime;

    if (finalGoals != null) {
      if (finalGoals >= extraTotal) {
        return finalGoals;
      }
      return extraTotal;
    }

    return extraTotal;
  }

  if (finalGoals != null) {
    return finalGoals;
  }

  if (status === "AET" && extraTime != null) {
    if (regulation != null && extraTime < regulation) {
      return regulation + extraTime;
    }
    return extraTime;
  }

  return regulation;
}

function evaluateBet(
  bet: any,
  fr: {
    home_goals: number;
    away_goals: number;
    outcome: "home" | "away" | "draw";
    halftime_home?: number;
    halftime_away?: number;
    halftime_outcome?: "home" | "away" | "draw";
    second_half_home?: number;
    second_half_away?: number;
    match_status?: "FT" | "AET" | "PEN";
    penalty_home?: number;
    penalty_away?: number;
    final_goals_home?: number;
    final_goals_away?: number;
  } | undefined,
): boolean {
  try {
    if (!bet || !fr) return false;

    // Extract market and selection from bet object
    // For bets table: use market_bets and bet_selection
    // For bet_selections table: use market and selection
    const market = bet.market || bet.market_bets || "";
    const selection = bet.selection || bet.bet_selection || "";

    // Clean selection text (remove odds if present)
    let cleanSelection = selection;
    if (cleanSelection && cleanSelection.includes(' @ ')) {
      const parts = cleanSelection.split(' @ ');
      cleanSelection = parts[0].trim();
    }

    const marketLower = market.toLowerCase().trim();
    const selectionLower = cleanSelection.toLowerCase().trim();

    const hg = Number(fr.home_goals ?? 0);
    const ag = Number(fr.away_goals ?? 0);
    const total = hg + ag;

    console.log(`Evaluating bet:`, {
      market: marketLower,
      selection: selectionLower,
      matchResult: {
        hg,
        ag,
        outcome: fr.outcome,
        halftime: fr.halftime_outcome,
        halftime_home: fr.halftime_home,
        halftime_away: fr.halftime_away,
        match_status: fr.match_status,
        final_goals: { home: fr.final_goals_home, away: fr.final_goals_away },
        penalties: { home: fr.penalty_home, away: fr.penalty_away }
      }
    });

    // To Qualify / Se Clasifica (ID: 61)
    if (marketLower === "to qualify" || marketLower === "se clasifica") {
      // Calculate total composite score: Goals (Regular + ET) + Penalties
      const goalsHome = fr.final_goals_home ?? hg; // Fallback to reg goals if final not parsed (should usually be present)
      const goalsAway = fr.final_goals_away ?? ag;

      const pensHome = fr.penalty_home ?? 0;
      const pensAway = fr.penalty_away ?? 0;

      const totalHome = goalsHome + pensHome;
      const totalAway = goalsAway + pensAway;

      console.log(`To Qualify evaluation: Home ${totalHome} vs Away ${totalAway} (Goals: ${goalsHome}-${goalsAway}, Pens: ${pensHome}-${pensAway})`);

      if (selectionLower.includes("home") || selectionLower.includes("local") || selectionLower.includes("1")) {
        return totalHome > totalAway;
      }
      if (selectionLower.includes("away") || selectionLower.includes("visitante") || selectionLower.includes("2")) {
        return totalAway > totalHome;
      }
      return false;
    }

    // Match Winner / Ganador del Partido
    if (marketLower === "ganador del partido") {
      if (selectionLower.includes("home") || selectionLower.includes("local")) {
        return fr.outcome === "home";
      }
      if (selectionLower.includes("away") || selectionLower.includes("visitante")) {
        return fr.outcome === "away";
      }
      if (selectionLower.includes("draw") || selectionLower.includes("empate")) {
        return fr.outcome === "draw";
      }
    }

    // Double Chance / Doble Oportunidad
    if (marketLower === "doble oportunidad") {
      if (selectionLower.includes("home/draw") || selectionLower.includes("local/empate")) {
        return fr.outcome === "home" || fr.outcome === "draw";
      }
      if (selectionLower.includes("draw/away") || selectionLower.includes("empate/visitante")) {
        return fr.outcome === "draw" || fr.outcome === "away";
      }
      if (selectionLower.includes("home/away") || selectionLower.includes("local/visitante")) {
        return fr.outcome === "home" || fr.outcome === "away";
      }
    }

    // Correct Score / Resultado Exacto
    if (marketLower === "resultado exacto") {
      if (selectionLower.includes(":") && /\d+:\d+/.test(selectionLower)) {
        const scoreMatch = selectionLower.match(/(\d+):(\d+)/);
        if (scoreMatch) {
          const expectedHome = parseInt(scoreMatch[1]);
          const expectedAway = parseInt(scoreMatch[2]);
          return hg === expectedHome && ag === expectedAway;
        }
      }
    }

    // First Half Winner / Ganador del 1er Tiempo
    if (marketLower === "ganador del 1er tiempo") {

      console.log(`First half bet evaluation:`, {
        market: marketLower,
        selection: selectionLower,
        halftime_outcome: fr.halftime_outcome,
        halftime_home: fr.halftime_home,
        halftime_away: fr.halftime_away,
        fullMatchResult: fr
      });

      // Calculate halftime outcome from goals if not available
      let halftimeOutcome = fr.halftime_outcome;
      if (!halftimeOutcome && fr.halftime_home !== undefined && fr.halftime_away !== undefined) {
        if (fr.halftime_home > fr.halftime_away) {
          halftimeOutcome = "home";
        } else if (fr.halftime_home < fr.halftime_away) {
          halftimeOutcome = "away";
        } else {
          halftimeOutcome = "draw";
        }
        console.log(`Calculated halftime outcome from goals: ${halftimeOutcome} (${fr.halftime_home}-${fr.halftime_away})`);
      }

      if (halftimeOutcome) {
        if (selectionLower.includes("home") || selectionLower.includes("local")) {
          const result = halftimeOutcome === "home";
          console.log(`First half home bet: ${result} (${halftimeOutcome} === "home")`);
          return result;
        }
        if (selectionLower.includes("away") || selectionLower.includes("visitante")) {
          const result = halftimeOutcome === "away";
          console.log(`First half away bet: ${result} (${halftimeOutcome} === "away")`);
          return result;
        }
        if (selectionLower.includes("draw") || selectionLower.includes("empate")) {
          const result = halftimeOutcome === "draw";
          console.log(`First half draw bet: ${result} (${halftimeOutcome} === "draw")`);
          return result;
        }
      }
      console.log(`No halftime data available for first half bet`);
      return false; // No halftime data available
    }

    // Second Half Winner / Ganador del 2do Tiempo
    if (marketLower === "ganador del 2do tiempo") {
      let secondHalfHome: number | undefined;
      let secondHalfAway: number | undefined;

      if (fr.second_half_home !== undefined && fr.second_half_home !== null &&
        fr.second_half_away !== undefined && fr.second_half_away !== null) {
        secondHalfHome = Number(fr.second_half_home);
        secondHalfAway = Number(fr.second_half_away);
      } else if (fr.halftime_home !== undefined && fr.halftime_home !== null &&
        fr.halftime_away !== undefined && fr.halftime_away !== null) {
        secondHalfHome = hg - Number(fr.halftime_home);
        secondHalfAway = ag - Number(fr.halftime_away);
      }

      if (secondHalfHome !== undefined && secondHalfAway !== undefined) {
        console.log(`Second half calculation:`, {
          fullTime: { hg, ag },
          halftime: { home: fr.halftime_home, away: fr.halftime_away },
          providedSecondHalf: { home: fr.second_half_home, away: fr.second_half_away },
          computedSecondHalf: { home: secondHalfHome, away: secondHalfAway },
          selection: selectionLower
        });

        if (selectionLower.includes("home") || selectionLower.includes("local")) {
          const result = secondHalfHome > secondHalfAway;
          console.log(`Second half home bet: ${result} (${secondHalfHome} > ${secondHalfAway})`);
          return result;
        }
        if (selectionLower.includes("away") || selectionLower.includes("visitante")) {
          const result = secondHalfHome < secondHalfAway;
          console.log(`Second half away bet: ${result} (${secondHalfHome} < ${secondHalfAway})`);
          return result;
        }
        if (selectionLower.includes("draw") || selectionLower.includes("empate")) {
          const result = secondHalfHome === secondHalfAway;
          console.log(`Second half draw bet: ${result} (${secondHalfHome} === ${secondHalfAway})`);
          return result;
        }
      }

      console.log(`No second half data available for second half bet`, {
        halftime_home: fr.halftime_home,
        halftime_away: fr.halftime_away,
        providedSecondHalf: { home: fr.second_half_home, away: fr.second_half_away }
      });
      return false;
    }

    // HT/FT Double / Medio Tiempo/Final
    if (marketLower === "medio tiempo/final" || marketLower === "ht/ft double") {
      if (selectionLower.includes("/")) {
        const parts = selectionLower.split("/");
        if (parts.length === 2) {
          const htPart = parts[0].trim();
          const ftPart = parts[1].trim();

          let htCorrect = false;
          let ftCorrect = false;

          // Calculate halftime outcome if not available
          let halftimeOutcome = fr.halftime_outcome;
          if (!halftimeOutcome && fr.halftime_home !== undefined && fr.halftime_away !== undefined) {
            if (fr.halftime_home > fr.halftime_away) {
              halftimeOutcome = "home";
            } else if (fr.halftime_home < fr.halftime_away) {
              halftimeOutcome = "away";
            } else {
              halftimeOutcome = "draw";
            }
          }

          console.log(`HT/FT bet evaluation:`, {
            market: marketLower,
            selection: selectionLower,
            htPart,
            ftPart,
            halftimeOutcome: halftimeOutcome,
            halftimeGoals: { home: fr.halftime_home, away: fr.halftime_away },
            fullTimeOutcome: fr.outcome
          });

          if (!halftimeOutcome) {
            console.log(`No halftime data available for HT/FT bet`);
            return false;
          }

          // Check halftime outcome - handle both English and Spanish
          if (htPart.toLowerCase().includes("home") || htPart.toLowerCase().includes("local") || htPart.includes("1")) {
            htCorrect = halftimeOutcome === "home";
          } else if (htPart.toLowerCase().includes("away") || htPart.toLowerCase().includes("visitante") || htPart.includes("2")) {
            htCorrect = halftimeOutcome === "away";
          } else if (htPart.toLowerCase().includes("draw") || htPart.toLowerCase().includes("empate") || htPart.includes("x")) {
            htCorrect = halftimeOutcome === "draw";
          }

          // Check full-time outcome - handle both English and Spanish
          if (ftPart.toLowerCase().includes("home") || ftPart.toLowerCase().includes("local") || ftPart.includes("1")) {
            ftCorrect = fr.outcome === "home";
          } else if (ftPart.toLowerCase().includes("away") || ftPart.toLowerCase().includes("visitante") || ftPart.includes("2")) {
            ftCorrect = fr.outcome === "away";
          } else if (ftPart.toLowerCase().includes("draw") || ftPart.toLowerCase().includes("empate") || ftPart.includes("x")) {
            ftCorrect = fr.outcome === "draw";
          }

          console.log(`HT/FT result:`, { htCorrect, ftCorrect, finalResult: htCorrect && ftCorrect });

          return htCorrect && ftCorrect;
        }
      }
      return false;
    }

    // Goals Over/Under / Goles Más/Menos de
    if (marketLower === "goles más/menos de") {

      let threshold: number | null = null;
      let over = selectionLower.includes("over") || selectionLower.includes("más");
      let under = selectionLower.includes("under") || selectionLower.includes("menos");

      // Extract threshold from selection
      const m1 = selectionLower.match(/(over|under|más|menos)\s*(?:de\s*)?([0-9]+(?:\.[0-9]+)?)/);
      if (m1) {
        threshold = parseFloat(m1[2]);
        over = m1[1] === "over" || m1[1] === "más";
        under = m1[1] === "under" || m1[1] === "menos";
      } else {
        const m2 = selectionLower.match(/\b([ou])\s*([0-9]+(?:\.[0-9]+)?)/);
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

    // Both Teams To Score (BTTS) / Ambos Equipos Marcan
    if (marketLower === "ambos equipos marcan") {
      const yes = selectionLower.includes("yes") || selectionLower.includes("sí") || selectionLower.includes("si");
      const no = selectionLower.includes("no");
      const bothScored = hg > 0 && ag > 0;
      if (yes) return bothScored;
      if (no) return !bothScored;
      return false;
    }

    // Result/Total Goals / Resultado/Total Goles
    if (marketLower === "resultado/total goles") {
      if (selectionLower.includes("/")) {
        const parts = selectionLower.split("/");
        if (parts.length === 2) {
          const resultPart = parts[0].trim();
          const overUnderPart = parts[1].trim();

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
          }

          return resultCorrect && overUnderCorrect;
        }
      }
      return false;
    }

    // Result/Both Teams Score / Resultado/Ambos Marcan
    if (marketLower === "resultado/ambos marcan") {
      if (selectionLower.includes("/")) {
        const parts = selectionLower.split("/");
        if (parts.length === 2) {
          const resultPart = parts[0].trim();
          const bttsPart = parts[1].trim();

          let resultCorrect = false;
          let bttsCorrect = false;

          // Check result part
          if (resultPart.includes("home") || resultPart.includes("local")) {
            resultCorrect = fr.outcome === "home";
          } else if (resultPart.includes("away") || resultPart.includes("visitante")) {
            resultCorrect = fr.outcome === "away";
          } else if (resultPart.includes("draw") || resultPart.includes("empate")) {
            resultCorrect = fr.outcome === "draw";
          }

          // Check both teams score part
          const bothScored = hg > 0 && ag > 0;
          if (bttsPart.includes("yes") || bttsPart.includes("sí") || bttsPart.includes("si")) {
            bttsCorrect = bothScored;
          } else if (bttsPart.includes("no")) {
            bttsCorrect = !bothScored;
          }

          return resultCorrect && bttsCorrect;
        }
      }
      return false;
    }

    // Result + Over/Under combinations (legacy format with & or and)
    if (selectionLower.includes("&") || selectionLower.includes("and")) {
      const parts = selectionLower.split(/[&]|and/).map((p: string) => p.trim());
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
        }

        return resultCorrect && overUnderCorrect;
      }
    }

    console.log(`No matching market found for: ${marketLower} - ${selectionLower}`);
    return false;
  } catch (error) {
    console.error("Error in evaluateBet:", error);
    return false;
  }
}

serve(async (req: Request) => {
  console.log('Protected function called');
  const startTime = Date.now();

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse request body to get potential internal secret
    const rawBody = await req.text();
    let parsedBody: any = {};
    try {
      parsedBody = rawBody ? JSON.parse(rawBody) : {};
    } catch (parseError) {
      console.log("Failed to parse body as JSON:", parseError);
    }

    // 1. Validate internal secret (from header or body)
    const secretFromHeader = req.headers.get('x-internal-secret');
    const secretFromBody = parsedBody.internal_secret;
    const providedSecret = secretFromHeader || secretFromBody;

    console.log('Internal secret from header present:', !!secretFromHeader);
    console.log('Internal secret from body present:', !!secretFromBody);

    // @ts-ignore - Deno global
    const INTERNAL_SECRET = Deno.env.get("INTERNAL_FUNCTION_SECRET");
    if (!INTERNAL_SECRET) {
      console.error('Missing INTERNAL_FUNCTION_SECRET environment variable');
      return new Response(JSON.stringify({
        error: 'Server configuration error: Missing internal secret',
        code: 'MISSING_INTERNAL_SECRET'
      }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!providedSecret || providedSecret !== INTERNAL_SECRET) {
      console.error('Invalid or missing internal secret');
      return new Response(JSON.stringify({
        error: 'Unauthorized: Invalid internal secret',
        code: 'INVALID_INTERNAL_SECRET'
      }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log('Internal secret authentication validated successfully');

    const jobName: string | undefined = parsedBody?.jobName;
    console.log('Request body:', { jobName, trigger: parsedBody?.trigger, timestamp: parsedBody?.timestamp });

    // @ts-ignore - Deno global
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    if (!SUPABASE_URL) {
      console.error("Missing SUPABASE_URL environment variable");
      return new Response(JSON.stringify({
        error: "Server configuration error: Missing Supabase URL",
        code: "MISSING_SUPABASE_URL"
      }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }    // @ts-ignore - Deno global
    const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    // @ts-ignore - Deno global
    const API_FOOTBALL_KEY = Deno.env.get("API_FOOTBALL_KEY");

    console.log('SERVICE_ROLE_KEY present:', !!SERVICE_ROLE_KEY);

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
    const sb = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // 1) Fetch recently finished fixtures for all leagues
    const baseUrl = "https://v3.football.api-sports.io";
    let allFinishedFixtures: any[] = [];

    for (const leagueId of leagueIds) {
      const leagueName = leagueId === 143
        ? 'Copa del Rey'
        : leagueId === 32
          ? 'Clasificación Europea Mundial'
          : null;

      console.log(`Fetching finished fixtures for ${leagueName} (ID: ${leagueId})`);

      // Fetch fixtures with different statuses separately
      const statuses = ['FT', 'AET', 'PEN'];
      let leagueFixtures: any[] = [];

      for (const status of statuses) {
        console.log(`Fetching ${status} fixtures for ${leagueName}`);

        const finishedRes = await fetch(`${baseUrl}/fixtures?league=${leagueId}&status=${status}&last=50`, {
          headers: { "x-apisports-key": API_FOOTBALL_KEY },
        });

        if (!finishedRes.ok) {
          console.warn(`Failed to fetch ${status} fixtures for league ${leagueId}: ${finishedRes.status}`);
          continue; // Skip this status and continue with others
        }

        const finishedJson = await finishedRes.json();
        const finished = finishedJson?.response ?? [];

        // Add league info and status to each fixture
        finished.forEach((fixture: any) => {
          if (fixture?.fixture?.id) {
            fixture.league_id = leagueId;
            fixture.league_name = leagueName;
            fixture.match_status = status; // Track how the match ended
          }
        });

        leagueFixtures.push(...finished);
        console.log(`Found ${finished.length} ${status} fixtures for ${leagueName}`);
      }

      allFinishedFixtures.push(...leagueFixtures);
      console.log(`Total fixtures found for ${leagueName}: ${leagueFixtures.length}`);
    }

    const finished = allFinishedFixtures;

    const resultsMap = new Map<number, {
      home_goals: number;
      away_goals: number;
      outcome: "home" | "away" | "draw";
      halftime_home?: number;
      halftime_away?: number;
      halftime_outcome?: "home" | "away" | "draw";
      second_half_home?: number;
      second_half_away?: number;
      match_status?: "FT" | "AET" | "PEN";
      penalty_home?: number;
      penalty_away?: number;
      final_goals_home?: number;
      final_goals_away?: number;
    }>();

    for (const fx of finished) {
      const id = fx?.fixture?.id;
      const matchStatus = normalizeMatchStatus(fx?.match_status || fx?.fixture?.status?.short);

      const halftimeHomeRaw = fx?.score?.halftime?.home ?? null;
      const halftimeAwayRaw = fx?.score?.halftime?.away ?? null;
      const fullTimeHomeRaw = fx?.score?.fulltime?.home ?? null;
      const fullTimeAwayRaw = fx?.score?.fulltime?.away ?? null;

      const penaltyHomeRaw = fx?.score?.penalty?.home ?? null;
      const penaltyAwayRaw = fx?.score?.penalty?.away ?? null;
      const goalsHomeRaw = fx?.goals?.home ?? null;
      const goalsAwayRaw = fx?.goals?.away ?? null;


      const halftimeHome = halftimeHomeRaw != null ? Number(halftimeHomeRaw) : null;
      const halftimeAway = halftimeAwayRaw != null ? Number(halftimeAwayRaw) : null;
      const fullTimeHome = fullTimeHomeRaw != null ? Number(fullTimeHomeRaw) : null;
      const fullTimeAway = fullTimeAwayRaw != null ? Number(fullTimeAwayRaw) : null;
      const penaltyHome = penaltyHomeRaw != null ? Number(penaltyHomeRaw) : null;
      const penaltyAway = penaltyAwayRaw != null ? Number(penaltyAwayRaw) : null;
      const finalGoalsHome = goalsHomeRaw != null ? Number(goalsHomeRaw) : null;
      const finalGoalsAway = goalsAwayRaw != null ? Number(goalsAwayRaw) : null;

      const regulationHome = fullTimeHome ?? finalGoalsHome;
      const regulationAway = fullTimeAway ?? finalGoalsAway;

      const oc = outcomeFromFixture(fx);
      let htOutcome: "home" | "away" | "draw" | undefined = undefined;

      if (halftimeHome !== null && halftimeAway !== null) {
        if (halftimeHome > halftimeAway) htOutcome = "home";
        else if (halftimeHome < halftimeAway) htOutcome = "away";
        else htOutcome = "draw";
      }

      let secondHalfHome: number | null = null;
      let secondHalfAway: number | null = null;

      if (regulationHome !== null && halftimeHome !== null) {
        const diff = regulationHome - halftimeHome;
        if (!Number.isNaN(diff)) {
          secondHalfHome = diff;
        }
      }

      if (regulationAway !== null && halftimeAway !== null) {
        const diff = regulationAway - halftimeAway;
        if (!Number.isNaN(diff)) {
          secondHalfAway = diff;
        }
      }

      if (id != null && regulationHome != null && regulationAway != null && oc) {
        resultsMap.set(id, {
          home_goals: regulationHome,
          away_goals: regulationAway,
          outcome: oc,
          halftime_home: halftimeHome ?? undefined,
          halftime_away: halftimeAway ?? undefined,
          halftime_outcome: htOutcome,
          second_half_home: secondHalfHome !== null ? secondHalfHome : undefined,
          second_half_away: secondHalfAway !== null ? secondHalfAway : undefined,
          match_status: matchStatus ?? undefined,
          penalty_home: penaltyHome ?? undefined,
          penalty_away: penaltyAway ?? undefined,
          // Store the RAW final goals from the API (includes ET if played, but usually not penalties in API-Football 'goals' field)
          final_goals_home: finalGoalsHome ?? undefined,
          final_goals_away: finalGoalsAway ?? undefined,
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

    // 1.5) Insert/update match results in match_results table
    console.log('Inserting/updating match results...');
    let matchResultsInserted = 0;
    for (const fx of finished) {
      const id = fx?.fixture?.id;
      const oc = outcomeFromFixture(fx);
      const matchStatus = normalizeMatchStatus(fx?.match_status || fx?.fixture?.status?.short);

      const halftimeHomeRaw = fx?.score?.halftime?.home ?? null;
      const halftimeAwayRaw = fx?.score?.halftime?.away ?? null;
      const fullTimeHomeRaw = fx?.score?.fulltime?.home ?? null;
      const fullTimeAwayRaw = fx?.score?.fulltime?.away ?? null;
      const extraHomeRaw = fx?.score?.extratime?.home ?? null;
      const extraAwayRaw = fx?.score?.extratime?.away ?? null;
      const penaltyHomeRaw = fx?.score?.penalty?.home ?? null;
      const penaltyAwayRaw = fx?.score?.penalty?.away ?? null;
      const goalsHomeRaw = fx?.goals?.home ?? null;
      const goalsAwayRaw = fx?.goals?.away ?? null;

      const halftimeHome = halftimeHomeRaw != null ? Number(halftimeHomeRaw) : null;
      const halftimeAway = halftimeAwayRaw != null ? Number(halftimeAwayRaw) : null;
      const fullTimeHome = fullTimeHomeRaw != null ? Number(fullTimeHomeRaw) : null;
      const fullTimeAway = fullTimeAwayRaw != null ? Number(fullTimeAwayRaw) : null;
      const extraTimeHome = extraHomeRaw != null ? Number(extraHomeRaw) : null;
      const extraTimeAway = extraAwayRaw != null ? Number(extraAwayRaw) : null;
      const penaltyHome = penaltyHomeRaw != null ? Number(penaltyHomeRaw) : null;
      const penaltyAway = penaltyAwayRaw != null ? Number(penaltyAwayRaw) : null;
      const finalHomeGoals = goalsHomeRaw != null ? Number(goalsHomeRaw) : null;
      const finalAwayGoals = goalsAwayRaw != null ? Number(goalsAwayRaw) : null;

      const regulationHome = fullTimeHome ?? finalHomeGoals;
      const regulationAway = fullTimeAway ?? finalAwayGoals;

      const finalHomeTotal = computeFinalGoals({
        regulation: regulationHome,
        finalGoals: finalHomeGoals,
        extraTime: extraTimeHome,
        status: matchStatus,
      });
      const finalAwayTotal = computeFinalGoals({
        regulation: regulationAway,
        finalGoals: finalAwayGoals,
        extraTime: extraTimeAway,
        status: matchStatus,
      });

      if (id && regulationHome !== null && regulationAway !== null && oc && fx?.teams?.home?.name && fx?.teams?.away?.name) {
        const displayFinalHome = finalHomeTotal ?? regulationHome;
        const displayFinalAway = finalAwayTotal ?? regulationAway;

        let secondHalfHome: number | null = null;
        let secondHalfAway: number | null = null;

        if (regulationHome !== null && halftimeHome !== null) {
          const diff = regulationHome - halftimeHome;
          if (!Number.isNaN(diff)) {
            secondHalfHome = diff;
          }
        }

        if (regulationAway !== null && halftimeAway !== null) {
          const diff = regulationAway - halftimeAway;
          if (!Number.isNaN(diff)) {
            secondHalfAway = diff;
          }
        }

        const formattedMatchResult = formatExtendedMatchResult({
          status: matchStatus,
          totalHome: displayFinalHome,
          totalAway: displayFinalAway,
          fullTimeHome: regulationHome,
          fullTimeAway: regulationAway,
          extraTimeHome,
          extraTimeAway,
          penaltyHome,
          penaltyAway,
        }) ?? `${regulationHome}-${regulationAway}`;

        // Check if match_results entry already exists to preserve kickoff_time
        const { data: existingResult } = await sb
          .from('match_results')
          .select('kickoff_time')
          .eq('fixture_id', id)
          .single();

        const { error: insertError } = await sb
          .from('match_results')
          .upsert({
            fixture_id: id,
            match_name: `${fx.teams.home.name} vs ${fx.teams.away.name}`,
            home_team: fx.teams.home.name,
            away_team: fx.teams.away.name,
            league_id: fx.league_id || 140, // Default to La Liga if no league_id found
            season: fx.league?.season || new Date().getFullYear(),
            home_goals: displayFinalHome,
            away_goals: displayFinalAway,
            halftime_home: halftimeHome !== null ? halftimeHome : 0,
            halftime_away: halftimeAway !== null ? halftimeAway : 0,
            second_half_home: secondHalfHome,
            second_half_away: secondHalfAway,
            outcome: oc,
            finished_at: fx.fixture?.date || new Date().toISOString(),
            match_result: formattedMatchResult,
            match_status: matchStatus,
            penalty_home: penaltyHome,
            penalty_away: penaltyAway,
            // Preserve existing kickoff_time if it exists, otherwise use fixture date
            kickoff_time: existingResult?.kickoff_time || fx.fixture?.date || new Date().toISOString()
          }, {
            onConflict: 'fixture_id'
          });

        if (insertError) {
          console.error(`Error upserting match result for fixture ${id}:`, insertError);
        } else {
          matchResultsInserted++;
          console.log(`✅ Upserted match result: ${fx.teams.home.name} vs ${fx.teams.away.name} (${formattedMatchResult})${matchStatus ? ` [${matchStatus}]` : ''}`);
        }
      }
    }
    console.log(`Match results processing completed: ${matchResultsInserted} results inserted/updated`);

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
        market_bets: b.market_bets,
        fixture_id: b.fixture_id
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

      // Create a proper bet object for evaluation with market and selection
      const betForEvaluation = {
        selection: bs.selection,
        market: bs.market,
        fixture_id: bs.fixture_id
      };

      console.log(`Processing bet selection ${bs.id}:`, {
        market: bs.market,
        selection: bs.selection,
        fixture_id: bs.fixture_id,
        match_result: fr
      });

      const isWin = evaluateBet(betForEvaluation, fr);
      console.log(`Bet selection ${bs.id} evaluation result: ${isWin ? 'WON' : 'LOST'}`);
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
      matchResults: matchResultsInserted,
      processingTimeMs: processingTime
    });

    return new Response(JSON.stringify({
      ok: true,
      updated: totalUpdated,
      singleBets: toUpdate.length,
      selections: selectionsToUpdate.length,
      comboBets: affectedComboBets.size,
      matchResults: matchResultsInserted,
      timing: { totalMs: processingTime },
      message: `Successfully processed ${totalUpdated} bet updates and ${matchResultsInserted} match results`
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
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