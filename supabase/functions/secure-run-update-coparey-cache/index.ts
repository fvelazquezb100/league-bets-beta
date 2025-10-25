import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-api-version",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const INTERNAL_SECRET = Deno.env.get("INTERNAL_FUNCTION_SECRET");
    if (!SUPABASE_URL || !SERVICE_ROLE_KEY || !INTERNAL_SECRET) {
      return new Response(JSON.stringify({ error: "missing env" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const sb = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
    const { data, error } = await sb.functions.invoke("update-coparey-cache", {
      body: { internal_secret: INTERNAL_SECRET, trigger: "admin", timestamp: new Date().toISOString() },
      headers: { 'x-internal-secret': INTERNAL_SECRET }
    });
    if (error) throw error;
    return new Response(JSON.stringify({ ok: true, data }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e?.message || e) }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});


