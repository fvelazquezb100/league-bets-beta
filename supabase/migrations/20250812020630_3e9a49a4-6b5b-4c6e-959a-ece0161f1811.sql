-- Create a Database Webhook to call the Edge Function on auth.users INSERT
-- Note: Uses Supabase Database Webhooks to forward events to the Edge Function "auth-handler"
-- This avoids direct triggers on the auth schema.

-- Create or replace the webhook (idempotent where possible)
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

-- Safely drop legacy trigger/function if present
-- Old trigger name used by common examples
drop trigger if exists on_auth_user_created on auth.users;
-- Drop the old function if it exists
drop function if exists public.handle_new_user();