import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// CORS for web calls and Supabase webhooks
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

console.log('Function "auth-handler" starting up');

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const supabase = createClient(supabaseUrl, serviceKey);

    const payload = await req.json().catch(() => null);
    console.log('Received payload:', JSON.stringify(payload)?.slice(0, 1000));

    // Database Webhook payload shape
    const type = payload?.type || payload?.event;
    const schema = payload?.schema || payload?.table?.schema;
    const table = payload?.table || payload?.table?.name;
    const record = payload?.record || payload?.new || payload?.user || null;

    // Only handle INSERTs into auth.users
    if (type !== 'INSERT' || schema !== 'auth' || (typeof table === 'string' ? table !== 'users' : table?.name !== 'users')) {
      console.log('Ignoring event. type:', type, 'schema:', schema, 'table:', table);
      return new Response(JSON.stringify({ ok: true, ignored: true }), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
        status: 200,
      });
    }

    const userId: string | undefined = record?.id;
    const email: string | undefined = record?.email || record?.raw_user_meta_data?.email;
    if (!userId || !email) {
      throw new Error('Missing user id or email in webhook payload');
    }

    const base = email.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '_').slice(0, 20);
    const suffix = Math.floor(1000 + Math.random() * 9000);
    const username = `${base}_${suffix}`;

    // Insert the profile (league_id left NULL on purpose)
    const { error: insertError } = await supabase
      .from('profiles')
      .insert({ id: userId, username, weekly_budget: 1000, total_points: 0, league_id: null });

    if (insertError) {
      // If a profile already exists (e.g., legacy trigger already ran), treat as success
      console.warn('Insert profile error:', insertError.message);
      return new Response(JSON.stringify({ ok: false, message: insertError.message }), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
        status: 200,
      });
    }

    console.log('Profile created for user', userId, 'username', username);
    return new Response(JSON.stringify({ ok: true, userId, username }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
      status: 200,
    });
  } catch (e) {
    console.error('auth-handler error:', (e as Error).message);
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
      status: 500,
    });
  }
});
