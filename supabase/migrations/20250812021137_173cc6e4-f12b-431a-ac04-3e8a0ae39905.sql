-- Create a Database Webhook to call the Edge Function on auth.users INSERT
-- Use Supabase Database Webhooks now that they are enabled

select supabase_functions.create_webhook(
  name => 'on_user_created',
  replace_existing => true,
  config => jsonb_build_object(
    'source', jsonb_build_object(
      'type', 'database',
      'schema', 'auth',
      'table', 'users',
      'events', array['INSERT']
    ),
    'destination', jsonb_build_object(
      'type', 'edge_function',
      'endpoint', 'auth-handler',
      'method', 'POST'
    )
  )
);

-- Drop legacy trigger/function if present
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();