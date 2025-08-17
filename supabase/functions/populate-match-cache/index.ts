import { serve } from "https://deno.land/std@0.208.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const footballApiKey = Deno.env.get('API_FOOTBALL_KEY')
    if (!footballApiKey) {
      throw new Error('API_FOOTBALL_KEY environment variable is not set')
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Fetch upcoming La Liga matches with odds from API-Football
    const response = await fetch(`https://v3.football.api-sports.io/odds?league=140&season=2025&next=10`, {
      headers: {
        'x-apisports-key': footballApiKey,
      }
    })

    if (!response.ok) {
      throw new Error(`Football API error: ${response.status} ${response.statusText}`)
    }

    const footballData = await response.json()
    
    // Update the match_odds_cache table
    const { error } = await supabase
      .from('match_odds_cache')
      .upsert({
        id: 1,
        data: footballData,
        last_updated: new Date().toISOString()
      })

    if (error) {
      throw error
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Match odds cache updated successfully',
        matches_count: footballData.response?.length || 0
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('Error updating match cache:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})