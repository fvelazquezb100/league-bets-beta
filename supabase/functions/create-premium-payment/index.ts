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
    console.log("create-premium-payment function called");
    
    // @ts-ignore
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    // @ts-ignore
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    // @ts-ignore
    const PAYPAL_CLIENT_ID = Deno.env.get("PAYPAL_CLIENT_ID");
    // @ts-ignore
    const PAYPAL_SECRET = Deno.env.get("PAYPAL_SECRET");
    // @ts-ignore
    const PAYPAL_MODE = Deno.env.get("PAYPAL_MODE") || "live"; // "live" or "sandbox"

    console.log("Environment check:", {
      hasSupabaseUrl: !!SUPABASE_URL,
      hasServiceRoleKey: !!SUPABASE_SERVICE_ROLE_KEY,
      hasPaypalClientId: !!PAYPAL_CLIENT_ID,
      hasPaypalSecret: !!PAYPAL_SECRET,
      paypalMode: PAYPAL_MODE,
    });

    if (!SUPABASE_SERVICE_ROLE_KEY) {
      console.error("Missing SUPABASE_SERVICE_ROLE_KEY");
      return new Response(
        JSON.stringify({ error: "Missing SUPABASE_SERVICE_ROLE_KEY" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (!PAYPAL_CLIENT_ID || !PAYPAL_SECRET) {
      console.error("Missing PayPal credentials");
      return new Response(
        JSON.stringify({ error: "Missing PayPal credentials" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Get authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      console.error("Missing authorization header");
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
      console.error("Missing bearer token");
      return new Response(
        JSON.stringify({ error: "Missing bearer token" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log("Creating Supabase admin client");
    // Create service role client for privileged operations
    const supabaseAdmin = createClient(
      SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY
    );

    console.log("Getting user from token");
    // Get the authenticated user from the provided token
    const {
      data: { user },
      error: userError,
    } = await supabaseAdmin.auth.getUser(token);

    if (userError || !user) {
      console.error("User error:", userError);
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log("User authenticated:", user.id);

    // Parse request body
    console.log("Parsing request body");
    const body = await req.json();
    console.log("Request body:", { amount: body.amount, league_id: body.league_id, has_discount_code: !!body.discount_code });
    const { amount, league_id, discount_code } = body;

    if (!amount || amount <= 0) {
      return new Response(
        JSON.stringify({ error: "Invalid amount" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (!league_id) {
      return new Response(
        JSON.stringify({ error: "league_id is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Verify user has access to this league
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("league_id")
      .eq("id", user.id)
      .single();

    if (profileError || !profile || profile.league_id !== league_id) {
      return new Response(
        JSON.stringify({ error: "Unauthorized: User does not belong to this league" }),
        {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Determine PayPal API base URL
    const paypalBaseUrl = PAYPAL_MODE === "sandbox"
      ? "https://api-m.sandbox.paypal.com"
      : "https://api-m.paypal.com";

    console.log("PayPal configuration:", {
      mode: PAYPAL_MODE,
      baseUrl: paypalBaseUrl,
      clientIdLength: PAYPAL_CLIENT_ID?.length || 0,
      secretLength: PAYPAL_SECRET?.length || 0,
      clientIdPrefix: PAYPAL_CLIENT_ID?.substring(0, 10) || "none",
    });

    // Step 1: Get PayPal access token
    const authResponse = await fetch(`${paypalBaseUrl}/v1/oauth2/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Authorization": `Basic ${btoa(`${PAYPAL_CLIENT_ID}:${PAYPAL_SECRET}`)}`,
      },
      body: "grant_type=client_credentials",
    });

    if (!authResponse.ok) {
      const errorText = await authResponse.text();
      console.error("PayPal auth error:", errorText);
      console.error("PayPal auth status:", authResponse.status, authResponse.statusText);
      return new Response(
        JSON.stringify({ 
          error: "Failed to authenticate with PayPal",
          details: errorText 
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const authData = await authResponse.json();
    const accessToken = authData.access_token;

    // Step 2: Create PayPal order
    const customData: any = {
      user_id: user.id,
      payment_type: "premium",
      league_id: league_id,
    };

    if (discount_code) {
      customData.discount_code = discount_code;
    }

    // Get frontend URL from request headers or use a default
    const frontendUrl = req.headers.get("Referer") 
      ? new URL(req.headers.get("Referer") || "").origin
      : "https://jambol.co";

    const orderPayload = {
      intent: "CAPTURE",
      purchase_units: [
        {
          amount: {
            currency_code: "EUR",
            value: amount.toFixed(2),
          },
          custom_id: JSON.stringify(customData),
        },
      ],
      application_context: {
        brand_name: "Jambol",
        landing_page: "NO_PREFERENCE",
        user_action: "PAY_NOW",
        return_url: `${frontendUrl}/admin-liga?payment=success`,
        cancel_url: `${frontendUrl}/admin-liga?payment=cancelled`,
      },
    };

    const orderResponse = await fetch(`${paypalBaseUrl}/v2/checkout/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${accessToken}`,
        "PayPal-Request-Id": crypto.randomUUID(),
      },
      body: JSON.stringify(orderPayload),
    });

    if (!orderResponse.ok) {
      const errorText = await orderResponse.text();
      console.error("PayPal order creation error:", errorText);
      return new Response(
        JSON.stringify({ error: "Failed to create PayPal order" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const orderData = await orderResponse.json();

    console.log("PayPal order response:", JSON.stringify(orderData, null, 2));
    console.log("All links:", JSON.stringify(orderData.links, null, 2));

    // Find the approval URL
    const approvalLink = orderData.links?.find(
      (link: any) => link.rel === "approve"
    );

    console.log("Approval link found:", JSON.stringify(approvalLink, null, 2));

    if (!approvalLink) {
      console.error("No approval link found in PayPal response");
      return new Response(
        JSON.stringify({ error: "No approval link found in PayPal response" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log("Returning approval_url:", approvalLink.href);

    return new Response(
      JSON.stringify({
        success: true,
        order_id: orderData.id,
        approval_url: approvalLink.href,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error in create-premium-payment:", error);
    console.error("Error message:", error?.message);
    console.error("Error stack:", error?.stack);
    console.error("Error name:", error?.name);
    return new Response(
      JSON.stringify({ 
        error: error?.message || "Internal server error",
        details: error?.stack || String(error)
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
