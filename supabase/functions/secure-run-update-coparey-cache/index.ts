// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
// We avoid using supabase-js to prevent adding Authorization headers (JWT) implicitly

const corsHeaders = {
  "Access-Control-Allow-Origin": "*", 
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-api-version",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

// Public wrapper that securely invokes the protected updater using the Service Role key from env
serve(async (req) => {
  console.log("=== Wrapper Function Start ===");
  console.log("Request method:", req.method);
  console.log("Request URL:", req.url);

  if (req.method === "OPTIONS") {
    console.log("Handling CORS preflight request");
    console.log("Request headers:", Object.fromEntries(req.headers.entries()));
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    console.log("Request headers:", Object.fromEntries(req.headers.entries()));
    
    // Parse request body
    let requestBody;
    try {
      const bodyText = await req.text();
      console.log("Raw request body:", bodyText);
      requestBody = bodyText ? JSON.parse(bodyText) : {};
    } catch {
      requestBody = {};
    }
    console.log("Parsed request body:", requestBody);

    // Environment check
    console.log("Environment check:");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const INTERNAL_SECRET = Deno.env.get("INTERNAL_FUNCTION_SECRET");
    
    console.log("- SUPABASE_URL available:", !!SUPABASE_URL);
    console.log("- SUPABASE_SERVICE_ROLE_KEY available:", !!SERVICE_ROLE_KEY);
    console.log("- SUPABASE_URL value:", SUPABASE_URL);

    const keyInfo = {
      present: !!SERVICE_ROLE_KEY,
      prefix: SERVICE_ROLE_KEY ? SERVICE_ROLE_KEY.slice(0, 3) : "none",
      isLegacyJWT: SERVICE_ROLE_KEY ? SERVICE_ROLE_KEY.startsWith("eyJ") : false,
      length: SERVICE_ROLE_KEY?.length ?? 0,
    };
    console.log("Service role key info:", keyInfo);

    if (!SERVICE_ROLE_KEY) {
      return new Response(JSON.stringify({ 
        error: "Missing SUPABASE_SERVICE_ROLE_KEY secret", 
        keyInfo 
      }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!INTERNAL_SECRET) {
      return new Response(JSON.stringify({ 
        error: "Missing INTERNAL_FUNCTION_SECRET", 
        keyInfo 
      }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("Invoking update-coparey-cache function via fetch (no JWT)");
    console.log("INTERNAL_SECRET present:", !!INTERNAL_SECRET);
    console.log("INTERNAL_SECRET prefix:", INTERNAL_SECRET ? INTERNAL_SECRET.slice(0, 5) : 'none');
    const functionStartTime = Date.now();

    const invokeUrl = `${SUPABASE_URL}/functions/v1/update-coparey-cache`;
    const requestPayload = {
      internal_secret: INTERNAL_SECRET,
      trigger: requestBody.trigger || 'admin',
      timestamp: new Date().toISOString(),
    };
    
    console.log("Request URL:", invokeUrl);
    console.log("Request payload keys:", Object.keys(requestPayload));
    
    const res = await fetch(invokeUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-internal-secret': INTERNAL_SECRET || '',
        'apikey': SERVICE_ROLE_KEY, // Add apikey to bypass edge runtime auth
        // intentionally omit Authorization to avoid JWT dependency
      },
      body: JSON.stringify(requestPayload),
    });
    
    console.log("Response status:", res.status);

    const functionTime = Date.now() - functionStartTime;
    let payload: any = null;
    try { payload = await res.json(); } catch {}

    if (!res.ok) {
      const errorDetails = payload?.error || `HTTP ${res.status}`;
      return new Response(JSON.stringify({ 
        error: errorDetails,
        timing: { functionMs: functionTime },
        status: res.status
      }), {
        status: res.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const totalTime = Date.now() - startTime;
    return new Response(JSON.stringify({ 
      ok: true, 
      data: payload, 
      keyInfo,
      timing: { functionMs: functionTime, totalMs: totalTime }
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (e) {
    const totalTime = Date.now() - startTime;
    console.error("secure-run-update-coparey-cache error", e);
    
    let errorDetails = String(e);
    let statusCode = 500;
    
    // Try to parse FunctionsHttpError for better error reporting
    if (e && typeof e === 'object' && 'context' in (e as any)) {
      try {
        const context = (e as any).context as any;
        if (context && context.status) {
          statusCode = context.status;
          if (context._bodyInit) {
            try {
              const errorBody = JSON.parse(context._bodyInit);
              errorDetails = `HTTP ${context.status}: ${JSON.stringify(errorBody)}`;
            } catch {
              errorDetails = `HTTP ${context.status}: ${context.statusText || 'Unknown error'}`;
            }
          }
        }
      } catch (parseError) {
        console.error("Error parsing function error:", parseError);
      }
    }

    return new Response(JSON.stringify({ 
      error: errorDetails,
      timing: { totalMs: totalTime },
      statusCode
    }), {
      status: statusCode,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

