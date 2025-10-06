// @ts-ignore - Deno import URL
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const internalSecret = Deno.env.get('INTERNAL_SECRET') || '';

    const authHeader = req.headers.get('authorization') || '';
    const internalHeader = req.headers.get('x-internal-secret') || '';

    let authorized = false;

    // 1) Allow calls with x-internal-secret
    if (internalHeader && internalSecret && internalHeader === internalSecret) {
      authorized = true;
    }

    // 2) Allow service-role bearer
    let userIdFromJwt: string | null = null;
    if (!authorized && authHeader && authHeader.toLowerCase().startsWith('bearer ')) {
      const token = authHeader.split(' ')[1];
      if (token === serviceKey) {
        authorized = true;
      } else {
        // Try to accept authenticated JWT from superadmin
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
      return new Response(JSON.stringify({ error: 'unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const supabase = createClient(supabaseUrl, serviceKey);

    // Call the public function (non-secure) to actually fetch and write cache id=2
    const { data, error } = await supabase.functions.invoke('update-selecciones-cache');
    if (error) throw error;

    return new Response(JSON.stringify({ ok: true, data }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e?.message || e) }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});


