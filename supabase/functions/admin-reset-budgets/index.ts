// @ts-ignore
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
// @ts-ignore
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Public admin wrapper that resets all weekly budgets using the Service Role key
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // @ts-ignore
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    // @ts-ignore
    const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const keyInfo = {
      present: !!SERVICE_ROLE_KEY,
      prefix: SERVICE_ROLE_KEY ? SERVICE_ROLE_KEY.slice(0, 3) : "none",
      isLegacyJWT: SERVICE_ROLE_KEY ? SERVICE_ROLE_KEY.startsWith("eyJ") : false,
      length: SERVICE_ROLE_KEY?.length ?? 0,
    };
    console.log("admin-reset-budgets keyInfo", keyInfo);
    if (!SERVICE_ROLE_KEY) {
      return new Response(JSON.stringify({ error: "Missing SUPABASE_SERVICE_ROLE_KEY secret", keyInfo }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const sb = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
    
    // Parse request body to check for manual week reset
    const body = await req.json().catch(() => ({}));
    const { manual_week_reset, force, recalculate, league_id } = body;

    if (manual_week_reset && force) {
      // MANUAL WEEK RESET: Reset completo de semana sin restricciones de tiempo
      console.log("Executing manual week reset...", league_id ? `for league ${league_id}` : "for all leagues");
      
      if (league_id) {
        // RESET ESPECÍFICO DE LIGA
        console.log(`Resetting week for specific league: ${league_id}`);
        
        // PASO 1: Obtener la semana actual de la liga
        const { data: leagueData, error: leagueError } = await sb
          .from('leagues')
          .select('week')
          .eq('id', league_id)
          .single();
        if (leagueError) throw leagueError;
        const currentWeek = leagueData.week;
        console.log(`Current week for league ${league_id}: ${currentWeek}`);

        // PASO 2: Guardar puntos de la semana actual para usuarios de esta liga
        // Primero obtenemos todos los usuarios de la liga
        const { data: profiles, error: profilesError } = await sb
          .from('profiles')
          .select('id')
          .eq('league_id', league_id);
        if (profilesError) throw profilesError;
        
        // Para cada usuario, calculamos y guardamos sus puntos de la semana actual
        for (const profile of profiles) {
          const { data: betsData, error: betsError } = await sb
            .from('bets')
            .select('payout')
            .eq('user_id', profile.id)
            .eq('week', currentWeek.toString());
          if (betsError) throw betsError;
          
          const totalPayout = betsData.reduce((sum, bet) => sum + (bet.payout || 0), 0);
          
          const { error: updateError } = await sb
            .from('profiles')
            .update({ last_week_points: totalPayout })
            .eq('id', profile.id);
          if (updateError) throw updateError;
        }
        console.log("Step 1: Last week points saved for league users");

        // PASO 3: Incrementar semana solo para esta liga
        const { error: incrementError } = await sb
          .from('leagues')
          .update({ week: currentWeek + 1 })
          .eq('id', league_id);
        if (incrementError) throw incrementError;
        console.log("Step 2: League week incremented");

        // PASO 4: Resetear presupuestos solo para usuarios de esta liga
        // Primero obtenemos el presupuesto de la liga
        const { data: leagueBudget, error: budgetError } = await sb
          .from('leagues')
          .select('budget')
          .eq('id', league_id)
          .single();
        if (budgetError) throw budgetError;
        
        const { error: resetError } = await sb
          .from('profiles')
          .update({ weekly_budget: leagueBudget.budget })
          .eq('league_id', league_id);
        if (resetError) throw resetError;
        console.log("Step 3: Weekly budgets reset for league users");

        return new Response(JSON.stringify({ 
          ok: true, 
          message: `Manual week reset completed successfully for league ${league_id}`,
          actions: [
            "Puntos de semana actual guardados para usuarios de la liga",
            "Semana de la liga incrementada", 
            "Presupuestos reseteados para usuarios de la liga"
          ],
          league_id,
          keyInfo 
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } else {
        // RESET GLOBAL (para SuperAdmin)
        console.log("Resetting week for all leagues");
        
        // PASO 1: Guardar puntos de la semana actual
        const { error: error1 } = await sb.rpc('update_last_week_points');
        if (error1) throw error1;
        console.log("Step 1: Last week points saved");

        // PASO 2: Incrementar semana en todas las ligas
        const { error: error2 } = await sb.rpc('increment_all_league_weeks');
        if (error2) throw error2;
        console.log("Step 2: League weeks incremented");

        // PASO 3: Resetear presupuestos sin restricción de día
        const { error: error3 } = await sb.rpc('reset_all_weekly_budgets');
        if (error3) throw error3;
        console.log("Step 3: Weekly budgets reset");

        return new Response(JSON.stringify({ 
          ok: true, 
          message: "Manual week reset completed successfully for all leagues",
          actions: [
            "Puntos de semana actual guardados",
            "Semanas de ligas incrementadas", 
            "Presupuestos reseteados"
          ],
          keyInfo 
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    if (recalculate) {
      // RECALCULATE POINTS: Recalcular puntos totales
      console.log("Executing points recalculation...");
      const { error } = await sb.rpc('recalc_total_points');
      if (error) throw error;

      return new Response(JSON.stringify({ ok: true, message: "Points recalculated successfully", keyInfo }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // DEFAULT: Reset weekly budgets for all profiles to 1000
    console.log("Executing default budget reset...");
    const { error } = await sb
      .from('profiles')
      .update({ weekly_budget: 1000 });

    if (error) throw error;

    return new Response(JSON.stringify({ ok: true, message: "All weekly budgets reset to 1000", keyInfo }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("admin-reset-budgets error", e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
