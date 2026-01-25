// @ts-ignore - Deno import URL
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
// @ts-ignore - Deno global
declare const Deno: any;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-internal-secret',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
};

Deno.serve(async (req) => {
  console.log("=== Selecciones Wrapper Function Start ===");
  console.log("Request method:", req.method);
  console.log("Request URL:", req.url);
  
  if (req.method === 'OPTIONS') {
    console.log("Handling CORS preflight request");
    console.log("Request headers:", Object.fromEntries(req.headers.entries()));
    return new Response('ok', { headers: corsHeaders });
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
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const internalSecret = Deno.env.get('INTERNAL_SECRET') || '';
    console.log("- SUPABASE_URL available:", !!supabaseUrl);
    console.log("- SUPABASE_SERVICE_ROLE_KEY available:", !!serviceKey);
    console.log("- INTERNAL_SECRET available:", !!internalSecret);
    console.log("- SUPABASE_URL value:", supabaseUrl);
    
    const keyInfo = {
      present: !!serviceKey,
      prefix: serviceKey ? serviceKey.slice(0, 3) : "none",
      isLegacyJWT: serviceKey ? serviceKey.startsWith("eyJ") : false,
      length: serviceKey?.length ?? 0
    };
    console.log("Service role key info:", keyInfo);

    if (!serviceKey) {
      return new Response(JSON.stringify({
        error: "Missing SUPABASE_SERVICE_ROLE_KEY secret",
        keyInfo
      }), {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        }
      });
    }

    const authHeader = req.headers.get('authorization') || '';
    const internalHeader = req.headers.get('x-internal-secret') || '';
    const userAgent = req.headers.get('user-agent') || '';
    
    console.log("Auth header present:", !!authHeader);
    console.log("Internal header present:", !!internalHeader);
    console.log("User agent:", userAgent);
    console.log("Auth header starts with 'bearer':", authHeader.toLowerCase().startsWith('bearer '));

    let authorized = false;

    // 0) Allow pg_cron calls (internal Supabase system)
    if (userAgent.includes('pg_net')) {
      console.log("Authorized via pg_cron (internal system)");
      authorized = true;
    }

    // 1) Allow calls with x-internal-secret
    if (internalHeader && internalSecret && internalHeader === internalSecret) {
      console.log("Authorized via x-internal-secret");
      authorized = true;
    }

    // 2) Allow service-role bearer
    let userIdFromJwt: string | null = null;
    if (!authorized && authHeader && authHeader.toLowerCase().startsWith('bearer ')) {
      const token = authHeader.split(' ')[1];
      console.log("Token extracted, length:", token?.length);
      
      if (token === serviceKey) {
        console.log("Authorized via service-role bearer");
        authorized = true;
      } else {
        // Try to accept authenticated JWT from superadmin
        try {
          const parts = token.split('.');
          if (parts.length === 3) {
            const payloadJson = JSON.parse(atob(parts[1]));
            userIdFromJwt = payloadJson?.sub || null;
            console.log("JWT user ID extracted:", userIdFromJwt);
          }
        } catch (e) {
          console.log("JWT parsing error:", e);
        }

        if (userIdFromJwt) {
          console.log("Checking superadmin role for user:", userIdFromJwt);
          const supabaseSrv = createClient(supabaseUrl, serviceKey);
          const { data: roleRow, error: roleErr } = await supabaseSrv
            .from('profiles')
            .select('global_role')
            .eq('id', userIdFromJwt)
            .single();
          
          console.log("Role check result:", { roleRow, roleErr });
          
          if (!roleErr && roleRow?.global_role === 'superadmin') {
            console.log("Authorized via superadmin JWT");
            authorized = true;
          }
        }
      }
    }

    console.log("Final authorization status:", authorized);

    if (!authorized) {
      console.log("Authorization failed - returning 401");
      return new Response(JSON.stringify({ error: 'unauthorized' }), { 
        status: 401, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    console.log("Creating Supabase client with service role key");
    const supabase = createClient(supabaseUrl, serviceKey);

    // Call the public function (non-secure) to actually fetch and write cache id=2
    console.log("Invoking update-selecciones-cache function");
    const functionStartTime = Date.now();
    const { data, error } = await supabase.functions.invoke('update-selecciones-cache');
    const functionTime = Date.now() - functionStartTime;
    console.log(`Function invocation took ${functionTime}ms`);
    
    if (error) {
      console.log("Function invocation error:", error);
      throw error;
    }
    
    console.log("Function invocation successful");
    console.log("Response data:", data);
    
    const totalTime = Date.now() - startTime;
    console.log(`Total execution time: ${totalTime}ms`);

    return new Response(JSON.stringify({ 
      ok: true, 
      data,
      keyInfo,
      timing: {
        functionMs: functionTime,
        totalMs: totalTime
      }
    }), { 
      status: 200, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  } catch (e) {
    const totalTime = Date.now() - startTime;
    console.error("secure-run-update-selecciones-cache error", e);
    
    let errorDetails = String(e);
    let statusCode = 500;
    
    // Try to parse FunctionsHttpError for better error reporting
    if (e && typeof e === 'object' && 'context' in e) {
      try {
        const context = e.context;
        if (context && context.status) {
          statusCode = context.status;
          // Try to get error details from the response
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
      timing: {
        totalMs: totalTime
      },
      statusCode
    }), {
      status: statusCode,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  }
});


