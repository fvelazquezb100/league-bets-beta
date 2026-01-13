// @ts-ignore
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("capture-paypal-order function called");

    // @ts-ignore
    const PAYPAL_CLIENT_ID = Deno.env.get("PAYPAL_CLIENT_ID");
    // @ts-ignore
    const PAYPAL_SECRET = Deno.env.get("PAYPAL_SECRET");
    // @ts-ignore
    const PAYPAL_MODE = Deno.env.get("PAYPAL_MODE") || "live";

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

    // Parse request body
    const body = await req.json();
    const { token } = body; // token is the order_id

    if (!token) {
      return new Response(
        JSON.stringify({ error: "Token (order_id) is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Determine PayPal API base URL
    const paypalBaseUrl = PAYPAL_MODE === "sandbox"
      ? "https://api-m.sandbox.paypal.com"
      : "https://api-m.paypal.com";

    console.log("Capturing order:", token);

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
      return new Response(
        JSON.stringify({
          error: "Failed to authenticate with PayPal",
          details: errorText,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const authData = await authResponse.json();
    const accessToken = authData.access_token;

    // Step 2: Capture the order
    const captureResponse = await fetch(`${paypalBaseUrl}/v2/checkout/orders/${token}/capture`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${accessToken}`,
      },
    });

    if (!captureResponse.ok) {
      const errorText = await captureResponse.text();
      console.error("PayPal capture error:", errorText);
      return new Response(
        JSON.stringify({
          error: "Failed to capture PayPal order",
          details: errorText,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const captureData = await captureResponse.json();
    console.log("Order captured successfully:", captureData.id);

    return new Response(
      JSON.stringify({
        success: true,
        order_id: captureData.id,
        status: captureData.status,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error in capture-paypal-order:", error);
    return new Response(
      JSON.stringify({
        error: error?.message || "Internal server error",
        details: error?.stack || String(error),
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
