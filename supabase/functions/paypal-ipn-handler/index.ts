// @ts-ignore
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
// @ts-ignore
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// PayPal IPN Handler
// Receives Instant Payment Notifications from PayPal when payments are completed
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // @ts-ignore
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    // @ts-ignore
    const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!SERVICE_ROLE_KEY) {
      console.error("Missing SUPABASE_SERVICE_ROLE_KEY");
      return new Response(JSON.stringify({ error: "Missing SERVICE_ROLE_KEY" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    // PayPal IPN sends data as application/x-www-form-urlencoded
    const contentType = req.headers.get("content-type") || "";
    
    let ipnData: Record<string, string> = {};
    
    if (contentType.includes("application/x-www-form-urlencoded")) {
      const formData = await req.formData();
      ipnData = Object.fromEntries(formData) as Record<string, string>;
    } else {
      // Fallback: try to parse as text and convert to form data
      const text = await req.text();
      const params = new URLSearchParams(text);
      ipnData = Object.fromEntries(params) as Record<string, string>;
    }

    console.log("PayPal IPN received:", {
      txn_type: ipnData.txn_type,
      payment_status: ipnData.payment_status,
      txn_id: ipnData.txn_id,
    });

    // Verify the IPN message is from PayPal
    // Send back the original message with cmd=_notify-validate
    const verificationUrl = ipnData.test_ipn === "1" 
      ? "https://ipnpb.sandbox.paypal.com/cgi-bin/webscr"
      : "https://ipnpb.paypal.com/cgi-bin/webscr";

    const verificationBody = new URLSearchParams();
    verificationBody.append("cmd", "_notify-validate");
    Object.keys(ipnData).forEach((key) => {
      verificationBody.append(key, ipnData[key]);
    });

    const verificationResponse = await fetch(verificationUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": "Jambol-IPN-Handler/1.0",
      },
      body: verificationBody.toString(),
    });

    const verificationText = await verificationResponse.text();

    if (verificationText !== "VERIFIED") {
      console.error("PayPal IPN verification failed:", verificationText);
      return new Response("INVALID", {
        status: 400,
        headers: corsHeaders,
      });
    }

    console.log("PayPal IPN verified successfully");

    // Only process completed payments
    const paymentStatus = ipnData.payment_status;
    if (paymentStatus !== "Completed" && paymentStatus !== "Processed") {
      console.log("Payment not completed, status:", paymentStatus);
      return new Response("OK - Payment not completed", {
        status: 200,
        headers: corsHeaders,
      });
    }

    // Extract payment information
    const transactionId = ipnData.txn_id;
    if (!transactionId) {
      console.error("Missing transaction_id");
      return new Response("INVALID - Missing transaction_id", {
        status: 400,
        headers: corsHeaders,
      });
    }

    // Check if this transaction was already processed
    const { data: existingPayment } = await supabase
      .from("payments")
      .select("id, status")
      .eq("transaction_id", transactionId)
      .single();

    if (existingPayment) {
      console.log("Transaction already processed:", transactionId);
      // Update status if it changed (e.g., refunded)
      if (existingPayment.status !== paymentStatus.toLowerCase()) {
        await supabase
          .from("payments")
          .update({
            status: paymentStatus.toLowerCase(),
            ipn_data: ipnData,
            updated_at: new Date().toISOString(),
          })
          .eq("transaction_id", transactionId);
      }
      return new Response("OK - Already processed", {
        status: 200,
        headers: corsHeaders,
      });
    }

    // Parse custom field to extract user_id, payment_type, and league_id
    // Format: JSON string like {"user_id":"uuid","payment_type":"donation","league_id":123}
    let userId: string | null = null;
    let paymentType: "donation" | "pro" | "premium" = "donation";
    let leagueId: number | null = null;

    const customField = ipnData.custom || ipnData.item_number || "";
    
    if (customField) {
      try {
        const customData = JSON.parse(customField);
        userId = customData.user_id || null;
        paymentType = customData.payment_type || "donation";
        leagueId = customData.league_id || null;
      } catch (e) {
        // Fallback: try to use custom field as user_id directly
        console.warn("Could not parse custom field as JSON, using as user_id:", e);
        userId = customField;
      }
    }

    // Fallback: try to extract from item_name or other fields
    if (!userId && ipnData.payer_id) {
      // If we can't get user_id from custom, we'll need to handle this differently
      console.warn("No user_id found in custom field");
    }

    // Extract payment details
    const amount = parseFloat(ipnData.mc_gross || ipnData.amount || "0");
    const currency = ipnData.mc_currency || ipnData.currency_code || "EUR";
    const payerEmail = ipnData.payer_email || ipnData.payer_mail || "";

    // Validate payment type
    if (!["donation", "pro", "premium"].includes(paymentType)) {
      console.error("Invalid payment_type:", paymentType);
      return new Response("INVALID - Invalid payment_type", {
        status: 400,
        headers: corsHeaders,
      });
    }

    // Validate required fields based on payment type
    if (paymentType === "premium" && !leagueId) {
      console.error("Premium payment requires league_id");
      return new Response("INVALID - Premium payment requires league_id", {
        status: 400,
        headers: corsHeaders,
      });
    }

    if ((paymentType === "donation" || paymentType === "pro") && !userId) {
      console.error("Donation/Pro payment requires user_id");
      return new Response("INVALID - Donation/Pro payment requires user_id", {
        status: 400,
        headers: corsHeaders,
      });
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
      status: paymentStatus.toLowerCase(),
      ipn_data: ipnData,
    };

    const { data: insertedPayment, error: insertError } = await supabase
      .from("payments")
      .insert(paymentData)
      .select()
      .single();

    if (insertError) {
      console.error("Error inserting payment:", insertError);
      return new Response(JSON.stringify({ error: insertError.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("Payment inserted successfully:", insertedPayment.id);

    // Handle post-payment actions based on payment type
    if (paymentStatus === "Completed" || paymentStatus === "Processed") {
      if (paymentType === "pro" && userId) {
        // Update user profile to PRO (assuming there's a field for this)
        // This would depend on your user structure
        console.log("PRO subscription activated for user:", userId);
        // Example: await supabase.from('profiles').update({ global_role: 'pro' }).eq('id', userId);
        // Note: You may want to add a separate field like 'subscription_type' instead of changing global_role
      }

      if (paymentType === "premium" && leagueId) {
        // Update league to premium
        const { error: leagueUpdateError } = await supabase
          .from("leagues")
          .update({ type: "premium" })
          .eq("id", leagueId);

        if (leagueUpdateError) {
          console.error("Error updating league to premium:", leagueUpdateError);
        } else {
          console.log("League upgraded to premium:", leagueId);
        }
      }
    }

    return new Response("OK", {
      status: 200,
      headers: corsHeaders,
    });
  } catch (error: any) {
    console.error("PayPal IPN handler error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

