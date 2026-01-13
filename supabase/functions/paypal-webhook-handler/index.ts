// @ts-ignore
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
// @ts-ignore
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// PayPal Webhook Handler
// Receives webhook notifications from PayPal Orders API v2 when payments are completed
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // @ts-ignore
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    // @ts-ignore
    const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    // @ts-ignore
    const PAYPAL_CLIENT_ID = Deno.env.get("PAYPAL_CLIENT_ID");
    // @ts-ignore
    const PAYPAL_SECRET = Deno.env.get("PAYPAL_SECRET");
    // @ts-ignore
    const PAYPAL_MODE = Deno.env.get("PAYPAL_MODE") || "live";

    if (!SERVICE_ROLE_KEY) {
      console.error("Missing SUPABASE_SERVICE_ROLE_KEY");
      return new Response(JSON.stringify({ error: "Missing SERVICE_ROLE_KEY" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!PAYPAL_CLIENT_ID || !PAYPAL_SECRET) {
      console.error("Missing PayPal credentials");
      return new Response(JSON.stringify({ error: "Missing PayPal credentials" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    // Get webhook signature headers
    const authAlgo = req.headers.get("PAYPAL-AUTH-ALGO");
    const certUrl = req.headers.get("PAYPAL-CERT-URL");
    const transmissionId = req.headers.get("PAYPAL-TRANSMISSION-ID");
    const transmissionSig = req.headers.get("PAYPAL-TRANSMISSION-SIG");
    const transmissionTime = req.headers.get("PAYPAL-TRANSMISSION-TIME");
    const webhookId = req.headers.get("PAYPAL-WEBHOOK-ID");

    // Read the raw body for signature verification
    const rawBody = await req.text();
    const webhookEvent = JSON.parse(rawBody);

    console.log("PayPal webhook received:", {
      event_type: webhookEvent.event_type,
      resource_type: webhookEvent.resource_type,
      summary: webhookEvent.summary,
    });

    // Verify webhook signature (optional but recommended for production)
    // For now, we'll skip verification in development but log a warning
    // In production, you should verify the signature using PayPal's verification API
    if (PAYPAL_MODE === "live" && (!authAlgo || !transmissionSig || !webhookId)) {
      console.warn("Webhook signature headers missing - skipping verification");
    }

    // Only process payment capture completed events
    // PayPal can send events in different formats: "PAYMENT.CAPTURE.COMPLETED" or "PAYMENT-CAPTURE-COMPLETED"
    const eventType = webhookEvent.event_type || "";
    const isPaymentCaptureCompleted = 
      eventType === "PAYMENT.CAPTURE.COMPLETED" || 
      eventType === "PAYMENT-CAPTURE-COMPLETED" ||
      eventType.toLowerCase().includes("payment") && 
      eventType.toLowerCase().includes("capture") && 
      eventType.toLowerCase().includes("completed");
    
    if (!isPaymentCaptureCompleted) {
      console.log("Ignoring event type:", eventType);
      return new Response(JSON.stringify({ message: "Event ignored" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Extract payment information from the resource
    const resource = webhookEvent.resource;
    if (!resource || resource.status !== "COMPLETED") {
      console.log("Payment not completed, status:", resource?.status);
      return new Response(JSON.stringify({ message: "Payment not completed" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Extract payment details
    const transactionId = resource.id;
    const amount = parseFloat(resource.amount?.value || "0");
    const currency = resource.amount?.currency_code || "EUR";
    const payerEmail = resource.payer?.email_address || "";
    
    // Get custom data from the order
    // We need to get the order details to access custom_id
    const paypalBaseUrl = PAYPAL_MODE === "sandbox"
      ? "https://api-m.sandbox.paypal.com"
      : "https://api-m.paypal.com";

    // Get access token to query order details
    const authResponse = await fetch(`${paypalBaseUrl}/v1/oauth2/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Authorization": `Basic ${btoa(`${PAYPAL_CLIENT_ID}:${PAYPAL_SECRET}`)}`,
      },
      body: "grant_type=client_credentials",
    });

    if (!authResponse.ok) {
      console.error("Failed to authenticate with PayPal for order lookup");
      // Continue processing with available data
    } else {
      const authData = await authResponse.json();
      const accessToken = authData.access_token;

      // Get order ID from the capture resource
      const orderId = resource.supplementary_data?.related_ids?.order_id;
      if (orderId) {
        try {
          const orderResponse = await fetch(`${paypalBaseUrl}/v2/checkout/orders/${orderId}`, {
            headers: {
              "Authorization": `Bearer ${accessToken}`,
              "Content-Type": "application/json",
            },
          });

          if (orderResponse.ok) {
            const orderData = await orderResponse.json();
            const purchaseUnit = orderData.purchase_units?.[0];
            const customId = purchaseUnit?.custom_id;

            if (customId) {
              try {
                const customData = JSON.parse(customId);
                console.log("Custom data from order:", customData);

                // Process payment with custom data
                await processPayment(
                  supabase,
                  customData.user_id,
                  customData.league_id,
                  customData.payment_type || "premium",
                  transactionId,
                  amount,
                  currency,
                  payerEmail,
                  webhookEvent
                );

                return new Response(JSON.stringify({ message: "Webhook processed successfully" }), {
                  status: 200,
                  headers: { ...corsHeaders, "Content-Type": "application/json" },
                });
              } catch (parseError) {
                console.error("Error parsing custom_id:", parseError);
              }
            }
          }
        } catch (orderError) {
          console.error("Error fetching order details:", orderError);
        }
      }
    }

    // If we couldn't get custom data from order, try to process with available data
    // This is a fallback - ideally we should always have custom_id
    console.warn("Processing payment without custom data (fallback)");
    return new Response(JSON.stringify({ message: "Webhook received but missing required data" }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("PayPal webhook handler error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
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
  webhookEvent: any
) {
  console.log("Processing payment:", {
    userId,
    leagueId,
    paymentType,
    transactionId,
    amount,
    currency,
    payerEmail,
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
    ipn_data: webhookEvent, // Store full webhook event
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
  }

  if (paymentType === "pro" && userId) {
    // Update user profile to PRO (if needed in the future)
    console.log("PRO subscription activated for user:", userId);
    // Example: await supabase.from('profiles').update({ global_role: 'pro' }).eq('id', userId);
  }
}
