// @ts-ignore - Deno import URL
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
// @ts-ignore - Deno global
declare const Deno: any;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-internal-secret',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('=== SECURE RUN PROCESS SELECCIONES RESULTS START ===');
    const startTime = Date.now();
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const internalSecret = Deno.env.get('INTERNAL_FUNCTION_SECRET') || '';

    console.log('Environment check:', {
      supabaseUrl: !!supabaseUrl,
      serviceKey: !!serviceKey,
      internalSecret: !!internalSecret
    });

    const authHeader = req.headers.get('authorization') || '';
    const internalHeader = req.headers.get('x-internal-secret') || '';

    console.log('Headers check:', {
      authHeader: !!authHeader,
      internalHeader: !!internalHeader
    });

    let authorized = false;

    // 1) Allow calls with x-internal-secret
    if (internalHeader && internalSecret && internalHeader === internalSecret) {
      console.log('Authorized via x-internal-secret');
      authorized = true;
    }

    // 2) Allow service-role bearer or superadmin JWT
    let userIdFromJwt: string | null = null;
    if (!authorized && authHeader && authHeader.toLowerCase().startsWith('bearer ')) {
      const token = authHeader.split(' ')[1];
      if (token === serviceKey) {
        authorized = true;
      } else {
        try {
          const parts = token.split('.');
          if (parts.length === 3) {
            const payloadJson = JSON.parse(atob(parts[1]));
            userIdFromJwt = payloadJson?.sub || null;
          }
        } catch (_) {}

        if (userIdFromJwt) {
          const supabaseSrv = createClient(supabaseUrl, serviceKey);
          const { data: roleRow, error: roleErr } = await supabaseSrv
            .from('profiles')
            .select('global_role')
            .eq('id', userIdFromJwt)
            .single();
          if (!roleErr && roleRow?.global_role === 'superadmin') {
            authorized = true;
          }
        }
      }
    }

    if (!authorized) {
      console.log('Authorization failed');
      return new Response(JSON.stringify({ error: 'unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    console.log('Authorization successful, calling process-selecciones-results');

    // Call the process-selecciones-results function directly with internal secret
    const functionUrl = `${supabaseUrl}/functions/v1/process-selecciones-results`;
    console.log('Calling function URL:', functionUrl);
    console.log('Using internal secret:', !!internalSecret);
    
    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-internal-secret': internalSecret
      }
    });

    console.log('Response status:', response.status);
    console.log('Response ok:', response.ok);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Function call failed:', response.status, errorText);
      throw new Error(`Function call failed: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    const endTime = Date.now();
    console.log('Function call successful, processing time:', endTime - startTime, 'ms');
    
    return new Response(JSON.stringify({ ok: true, data }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (e) {
    console.error('=== SECURE RUN PROCESS SELECCIONES RESULTS ERROR ===');
    console.error('Error message:', e?.message || String(e));
    console.error('Error stack:', e?.stack);
    return new Response(JSON.stringify({ error: String(e?.message || e) }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});


