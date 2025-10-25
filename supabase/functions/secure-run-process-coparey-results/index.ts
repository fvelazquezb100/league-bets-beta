// @ts-ignore - Deno import URL
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-internal-secret',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const internalSecret = Deno.env.get('INTERNAL_FUNCTION_SECRET') || '';

    const authHeader = req.headers.get('authorization') || '';
    const internalHeader = req.headers.get('x-internal-secret') || '';

    let authorized = false;
    if (internalHeader && internalHeader === internalSecret) authorized = true;
    if (!authorized && authHeader && authHeader.toLowerCase().startsWith('bearer ')) {
      const token = authHeader.split(' ')[1];
      if (token === serviceKey) authorized = true;
    }
    if (!authorized) {
      return new Response(JSON.stringify({ error: 'unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const sb = createClient(supabaseUrl, serviceKey);
    const functionUrl = `${supabaseUrl}/functions/v1/process-coparey-results`;
    const resp = await fetch(functionUrl, { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-internal-secret': internalSecret } });
    if (!resp.ok) {
      const t = await resp.text();
      throw new Error(`Function call failed: ${resp.status} ${t}`);
    }
    const data = await resp.json();
    return new Response(JSON.stringify({ ok: true, data }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e?.message || e) }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});


