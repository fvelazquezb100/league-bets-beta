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
    console.log("capture-paypal-order function called");

    // @ts-ignore
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    // @ts-ignore
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    // @ts-ignore
    const PAYPAL_CLIENT_ID = Deno.env.get("PAYPAL_CLIENT_ID");
    // @ts-ignore
    const PAYPAL_SECRET = Deno.env.get("PAYPAL_SECRET");
    // @ts-ignore
    const PAYPAL_MODE = Deno.env.get("PAYPAL_MODE") || "live";

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

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

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
    console.log("Capture data structure:", JSON.stringify(captureData, null, 2));

    // Step 3: Extract payment details from the captured order
    const purchaseUnit = captureData.purchase_units?.[0];
    console.log("Purchase unit:", JSON.stringify(purchaseUnit, null, 2));
    
    const capture = purchaseUnit?.payments?.captures?.[0];
    // custom_id can be in purchase_unit.custom_id OR in capture.custom_id
    let customId = purchaseUnit?.custom_id || capture?.custom_id;

    console.log("Custom ID from purchase_unit:", purchaseUnit?.custom_id);
    console.log("Custom ID from capture:", capture?.custom_id);
    console.log("Using custom_id:", customId);
    console.log("Capture:", JSON.stringify(capture, null, 2));

    // If custom_id is still not found, try to get order details
    if (!customId) {
      console.log("custom_id not found in capture response, fetching order details...");
      try {
        const orderResponse = await fetch(`${paypalBaseUrl}/v2/checkout/orders/${token}`, {
          headers: {
            "Authorization": `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        });

        if (orderResponse.ok) {
          const orderData = await orderResponse.json();
          console.log("Order data:", JSON.stringify(orderData, null, 2));
          const orderPurchaseUnit = orderData.purchase_units?.[0];
          customId = orderPurchaseUnit?.custom_id || orderPurchaseUnit?.payments?.captures?.[0]?.custom_id;
          console.log("Custom ID from order details:", customId);
        }
      } catch (orderError) {
        console.error("Error fetching order details:", orderError);
      }
    }

    if (!customId) {
      console.error("No custom_id found in captured order or order details");
      console.error("Full capture data:", JSON.stringify(captureData, null, 2));
      return new Response(
        JSON.stringify({ error: "No custom_id found in order. The order may have been processed already." }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (!capture) {
      console.error("No capture found in order");
      console.error("Purchase unit payments:", JSON.stringify(purchaseUnit?.payments, null, 2));
      return new Response(
        JSON.stringify({ error: "No capture found in order" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Parse custom data
    let customData: any;
    try {
      customData = JSON.parse(customId);
      console.log("Custom data from order:", customData);
    } catch (parseError) {
      console.error("Error parsing custom_id:", parseError);
      return new Response(
        JSON.stringify({ error: "Invalid custom_id format" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Extract payment information
    const transactionId = capture.id;
    const amount = parseFloat(capture.amount?.value || "0");
    const currency = capture.amount?.currency_code || "EUR";
    const payerEmail = captureData.payer?.email_address || "";

    // Step 4: Process the payment (update league and discount counter)
    await processPayment(
      supabase,
      customData.user_id,
      customData.league_id,
      customData.payment_type || "premium",
      transactionId,
      amount,
      currency,
      payerEmail,
      captureData,
      customData.discount_code || null
    );

    return new Response(
      JSON.stringify({
        success: true,
        order_id: captureData.id,
        status: captureData.status,
        message: "Payment processed successfully",
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

async function processPayment(
  supabase: any,
  userId: string | null,
  leagueId: number | null,
  paymentType: "donation" | "pro" | "premium",
  transactionId: string,
  amount: number,
  currency: string,
  payerEmail: string,
  captureData: any,
  discountCode: string | null = null
) {
  console.log("Processing payment:", {
    userId,
    leagueId,
    paymentType,
    transactionId,
    amount,
    currency,
    payerEmail,
    discountCode,
  });

  // Validate payment type
  if (!["donation", "pro", "premium"].includes(paymentType)) {
    throw new Error(`Invalid payment_type: ${paymentType}`);
  }

  // Validate required fields based on payment type
  if (paymentType === "premium" && !leagueId) {
    throw new Error("Premium payment requires league_id");
  }

  if (paymentType === "pro" && !userId) {
    throw new Error("Pro payment requires user_id");
  }

  // Check if payment already exists (idempotency)
  const { data: existingPayment } = await supabase
    .from("payments")
    .select("id, status")
    .eq("transaction_id", transactionId)
    .maybeSingle();

  if (existingPayment) {
    console.log("Payment already exists:", existingPayment.id);
    // Update status if needed
    if (existingPayment.status !== "completed") {
      await supabase
        .from("payments")
        .update({ status: "completed" })
        .eq("id", existingPayment.id);
    }
    return;
  }

  // Insert payment record
  const paymentData: any = {
    user_id: userId,
    league_id: leagueId,
    payment_type: paymentType,
    amount: amount,
    currency: currency,
    transaction_id: transactionId,
    payer_email: payerEmail,
    status: "completed",
    ipn_data: captureData, // Store full capture data
  };

  const { data: insertedPayment, error: insertError } = await supabase
    .from("payments")
    .insert(paymentData)
    .select()
    .single();

  if (insertError) {
    console.error("Error inserting payment:", insertError);
    throw insertError;
  }

  console.log("Payment inserted successfully:", insertedPayment.id);

  // Handle post-payment actions based on payment type
  if (paymentType === "premium" && leagueId) {
    // Update league to premium
    const { error: leagueUpdateError } = await supabase
      .from("leagues")
      .update({ type: "premium" })
      .eq("id", leagueId);

    if (leagueUpdateError) {
      console.error("Error updating league to premium:", leagueUpdateError);
      // Don't throw - payment is already recorded
    } else {
      console.log("League upgraded to premium:", leagueId);
    }

    // If a discount code was used, increment its usage counter
    if (discountCode) {
      const { error: discountUpdateError } = await supabase.rpc('increment_discount_usage', {
        discount_code_param: discountCode.toUpperCase()
      });
      
      if (discountUpdateError) {
        // Log error but don't fail the payment processing
        console.error("Error incrementing discount usage:", discountUpdateError);
      } else {
        console.log("Discount usage incremented:", discountCode);
      }
    }
  }

  if (paymentType === "pro" && userId) {
    // Update user profile to PRO (if needed in the future)
    console.log("PRO subscription activated for user:", userId);
    // Example: await supabase.from('profiles').update({ global_role: 'pro' }).eq('id', userId);
  }
}
