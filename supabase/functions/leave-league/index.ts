// @ts-ignore - Deno imports
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

Deno.serve(async (req) => {
  console.log('Function called with method:', req.method);
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Getting request body...');
    const body = await req.json();
    console.log('Request body:', body);
    
    const { user_id } = body;

    if (!user_id) {
      console.log('No user_id provided');
      return new Response(
        JSON.stringify({ error: 'user_id is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('User ID:', user_id);

    // Initialize Supabase client with service role key
    console.log('Creating Supabase client...');
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    console.log('Checking if user exists...');
    // Check if user exists
    const { data: userData, error: userError } = await supabase
      .from('profiles')
      .select('id, league_id, total_points, last_week_points')
      .eq('id', user_id)
      .single();

    if (userError) {
      console.log('User error:', userError);
      return new Response(
        JSON.stringify({ error: 'User not found', details: userError.message }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    if (!userData) {
      console.log('No user data found');
      return new Response(
        JSON.stringify({ error: 'User not found' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('User data:', userData);

    console.log('Updating user profile...');
    // Reset user data
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ 
        total_points: 0,
        last_week_points: 0,
        league_id: null
      })
      .eq('id', user_id);

    if (profileError) {
      console.log('Profile update error:', profileError);
      throw new Error(`Failed to update profile: ${profileError.message}`);
    }

    console.log('Updating user bets...');
    // Update user's bets to week 0
    const { error: betsError } = await supabase
      .from('bets')
      .update({ 
        week: 0
      })
      .eq('user_id', user_id);

    if (betsError) {
      console.log('Bets update error:', betsError);
      throw new Error(`Failed to update bets: ${betsError.message}`);
    }

    console.log('Success! Returning response...');
    // Return success response
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Successfully left the league',
        user_id: user_id,
        previous_league_id: userData.league_id,
        previous_total_points: userData.total_points,
        previous_last_week_points: userData.last_week_points,
        reset_at: new Date().toISOString()
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in leave-league function:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error.message,
        stack: error.stack
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
