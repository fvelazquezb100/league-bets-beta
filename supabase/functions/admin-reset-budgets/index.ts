import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
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
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
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

    // Reset weekly budgets for all profiles to 1000
    const { error } = await sb
      .from('profiles')
      .update({ weekly_budget: 1000 });

    if (error) throw error;

    return new Response(JSON.stringify({ ok: true, message: "All weekly budgets reset to 1000", keyInfo }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("admin-reset-budgets error", e);
    return new Response(JSON.stringify({ error: String(e), keyInfo }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
