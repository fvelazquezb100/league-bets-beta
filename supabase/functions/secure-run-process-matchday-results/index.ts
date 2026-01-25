import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Public wrapper that invokes the protected results processor using the Service Role key from env
serve(async (req) => {
  const startTime = Date.now();
  console.log("=== Wrapper Function Start ===");
  
  // Log request details
  console.log("Request method:", req.method);
  console.log("Request URL:", req.url);
  console.log("Request headers:", Object.fromEntries(req.headers.entries()));
  
  if (req.method === "OPTIONS") {
    console.log("Handling CORS preflight request");
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Log environment variables availability
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    console.log("Environment check:");
    console.log("- SUPABASE_URL available:", !!SUPABASE_URL);
    console.log("- SUPABASE_URL value:", SUPABASE_URL);
    console.log("- SUPABASE_SERVICE_ROLE_KEY available:", !!SERVICE_ROLE_KEY);
    
    // Get and log request body
    const rawBody = await req.text();
    console.log("Raw request body:", rawBody);
    
    let parsedBody = {};
    try {
      parsedBody = rawBody ? JSON.parse(rawBody) : {};
      console.log("Parsed request body:", parsedBody);
    } catch (parseError) {
      console.log("Failed to parse body as JSON:", parseError);
      parsedBody = {};
    }
    
    const keyInfo = {
      present: !!SERVICE_ROLE_KEY,
      prefix: SERVICE_ROLE_KEY ? SERVICE_ROLE_KEY.slice(0, 3) : "none",
      isLegacyJWT: SERVICE_ROLE_KEY ? SERVICE_ROLE_KEY.startsWith("eyJ") : false,
      length: SERVICE_ROLE_KEY?.length ?? 0,
    };
    console.log("Service role key info:", keyInfo);
    
    if (!SUPABASE_URL) {
      const errorResponse = {
        error: "Missing SUPABASE_URL secret",
        code: "MISSING_SUPABASE_URL",
        hint: "Set SUPABASE_URL in Edge Function secrets (usually auto-injected).",
      };
      console.error("ERROR: Missing Supabase URL");
      return new Response(JSON.stringify(errorResponse), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    
    if (!SERVICE_ROLE_KEY) {
      const errorResponse = {
        error: "Missing SUPABASE_SERVICE_ROLE_KEY secret",
        code: "MISSING_SERVICE_ROLE_KEY",
        hint: "Set SUPABASE_SERVICE_ROLE_KEY in Edge Function secrets (Dashboard → Project Settings → Edge Functions).",
      };
      console.error("ERROR: Missing service role key");
      return new Response(JSON.stringify(errorResponse), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create Supabase admin client
    console.log("Creating Supabase client with service role key");
    const supabaseAdmin = createClient(SUPABASE_URL!, SERVICE_ROLE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Call the protected function with proper headers
    console.log("Invoking process-matchday-results function");
    const invokeStartTime = Date.now();
    
    const INTERNAL_SECRET = Deno.env.get("INTERNAL_FUNCTION_SECRET");
    if (!INTERNAL_SECRET) {
      const errorResponse = {
        error: "Missing INTERNAL_FUNCTION_SECRET",
        code: "MISSING_INTERNAL_SECRET",
        hint: "Set INTERNAL_FUNCTION_SECRET in Edge Function secrets (Dashboard → Project Settings → Edge Functions). Same value as in Vault for cron.",
      };
      console.error("ERROR: Missing internal function secret");
      return new Response(JSON.stringify(errorResponse), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data, error } = await supabaseAdmin.functions.invoke("process-matchday-results", {
      body: { ...parsedBody, internal_secret: INTERNAL_SECRET },
      headers: {
        'x-internal-secret': INTERNAL_SECRET,
        'Content-Type': 'application/json'
      }
    });

    const invokeEndTime = Date.now();
    console.log(`Function invocation took ${invokeEndTime - invokeStartTime}ms`);

    if (error) {
      console.error("Function invocation error:", error.message);
      const resp = error.context as Response | undefined;
      if (resp) {
        console.error("process-matchday-results response status:", resp.status, resp.statusText);
      }

      let innerError = "";
      let innerCode: string | undefined;
      let rawBody = "";
      try {
        if (resp && typeof resp.text === "function") {
          rawBody = await resp.text();
          console.error("process-matchday-results response body (raw):", rawBody);
        }
      } catch (_) {
        console.error("Could not read process-matchday-results response body");
      }
      if (rawBody) {
        try {
          const errorBody = JSON.parse(rawBody) as { error?: string; message?: string; code?: string };
          innerError = errorBody.error || errorBody.message || "";
          innerCode = errorBody.code;
        } catch (_) {}
      }
      const fallbackError = innerError || rawBody || error.message;
      
      const errorResponse = {
        error: fallbackError,
        code: innerCode ?? "PROCESS_MATCHDAY_ERROR",
        source: "process-matchday-results",
        keyInfo,
        timing: { totalMs: invokeEndTime - startTime, invokeMs: invokeEndTime - invokeStartTime },
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("Function invocation successful");
    console.log("Response data:", data);

    const endTime = Date.now();
    console.log(`Total execution time: ${endTime - startTime}ms`);

    return new Response(JSON.stringify({ 
      ok: true, 
      data, 
      keyInfo,
      timing: {
        totalMs: endTime - startTime,
        invokeMs: invokeEndTime - invokeStartTime
      }
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    const endTime = Date.now();
    const err = e instanceof Error ? e : new Error(String(e));
    console.error("=== ERROR in secure-run-process-matchday-results ===");
    console.error("Error message:", err.message);
    console.error("Error stack:", err.stack);
    console.error("Full error object:", JSON.stringify(e, null, 2));
    console.error(`Error occurred after ${endTime - startTime}ms`);
    
    const sk = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const keyInfo = {
      present: !!sk,
      prefix: sk ? sk.slice(0, 3) : "none",
      isLegacyJWT: sk ? sk.startsWith("eyJ") : false,
      length: sk?.length ?? 0,
    };
    
    const errorResponse = {
      error: err.message,
      code: "SECURE_RUN_UNEXPECTED",
      source: "secure-run-process-matchday-results",
      keyInfo,
      timing: { totalMs: endTime - startTime },
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});