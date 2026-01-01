// @ts-ignore
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
// @ts-ignore
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // @ts-ignore
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    // @ts-ignore
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!SUPABASE_SERVICE_ROLE_KEY) {
      return new Response(
        JSON.stringify({ error: "Missing SUPABASE_SERVICE_ROLE_KEY" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Get authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const token = authHeader.replace("Bearer ", "").trim();
    if (!token) {
      return new Response(
        JSON.stringify({ error: "Missing bearer token" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Create service role client for privileged operations
    const supabaseAdmin = createClient(
      SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY
    );

    // Get the authenticated user from the provided token
    const {
      data: { user },
      error: userError,
    } = await supabaseAdmin.auth.getUser(token);

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Get user's profile to check role and league_id
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("id, role, league_id")
      .eq("id", user.id)
      .single();

    if (profileError || !profile) {
      return new Response(
        JSON.stringify({ error: "Profile not found" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Verify user is admin_league
    if (profile.role !== "admin_league") {
      return new Response(
        JSON.stringify({ error: "Only league administrators can upgrade to premium" }),
        {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (!profile.league_id) {
      return new Response(
        JSON.stringify({ error: "User is not in a league" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Get current league type
    const { data: league, error: leagueError } = await supabaseAdmin
      .from("leagues")
      .select("id, type")
      .eq("id", profile.league_id)
      .single();

    if (leagueError || !league) {
      return new Response(
        JSON.stringify({ error: "League not found" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Check if already premium
    if (league.type === "premium") {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "League is already premium",
          already_premium: true 
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Update league to premium
    const { error: updateError } = await supabaseAdmin
      .from("leagues")
      .update({ type: "premium" })
      .eq("id", profile.league_id);

    if (updateError) {
      console.error("Error updating league to premium:", updateError);
      return new Response(
        JSON.stringify({ error: "Failed to upgrade league to premium" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Register payment (free upgrade) in payments table
    const transactionId = `upgrade-${crypto.randomUUID()}`;
    const { data: paymentRecord, error: paymentError } = await supabaseAdmin
      .from("payments")
      .insert({
        user_id: user.id,
        league_id: profile.league_id,
        payment_type: "premium",
        amount: 0,
        currency: "EUR",
        transaction_id: transactionId,
        payer_email: user.email || null,
        status: "completed",
        ipn_data: {
          source: "upgrade-league-to-premium",
          free: true,
        },
      })
      .select("id")
      .single();

    if (paymentError) {
      console.error("Error registering payment record:", paymentError);
      // Continue but return warning
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "League upgraded to premium, but payment log failed",
          league_id: profile.league_id,
          payment_error: paymentError.message,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "League upgraded to premium successfully",
        league_id: profile.league_id,
        payment_id: paymentRecord?.id ?? null,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error in upgrade-league-to-premium:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

