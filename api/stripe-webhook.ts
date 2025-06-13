// FILE: api/stripe-webhook.ts

import Stripe from 'stripe';
import { Resend } from 'resend';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { buffer } from 'micro';
import type { VercelRequest, VercelResponse } from '@vercel/node';

// --- Environment Variables ---
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const webhookSigningSecret = process.env.STRIPE_WEBHOOK_SECRET; // Renamed for clarity
const resendApiKey = process.env.RESEND_API_KEY;
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

// --- Initialize Clients ---
let stripe: Stripe;
let resend: Resend;
let supabaseAdmin: SupabaseClient;
let globalInitError: string | null = null; // For errors during top-level init

try {
  if (!stripeSecretKey) throw new Error('STRIPE_SECRET_KEY is missing.');
  // Use the apiVersion your TypeScript expects
  stripe = new Stripe(stripeSecretKey, { apiVersion: '2025-04-30.basil' }); 

  if (!webhookSigningSecret) throw new Error('STRIPE_WEBHOOK_SECRET is missing.');
  
  if (!resendApiKey) throw new Error('RESEND_API_KEY is missing.');
  resend = new Resend(resendApiKey);

  if (!supabaseUrl || !supabaseServiceKey) throw new Error('SUPABASE_URL or SUPABASE_SERVICE_KEY is missing.');
  supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false, autoRefreshToken: false }
  });
  console.log("[API StripeWebhook] All clients initialized successfully.");
} catch (e: any) {
  globalInitError = `Webhook Initialization Error: ${e.message}`;
  console.error(globalInitError, e);
  // Note: If this block runs, the handler below will immediately return 500.
}
// --- End Initialization ---

export const config = {
  api: { bodyParser: false, },
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Check for global initialization errors first
  if (globalInitError || !stripe || !resend || !supabaseAdmin) {
    console.error("[API StripeWebhook] Handler cannot proceed due to client initialization failure:", globalInitError);
    return res.status(500).json({ error: globalInitError || "Server critical configuration error." });
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end('Method Not Allowed');
  }

  const sig = req.headers['stripe-signature'] as string;
  let event: Stripe.Event;

  try {
    const buf = await buffer(req);
    // webhookSigningSecret is guaranteed to be a string here if globalInitError is null
    event = stripe.webhooks.constructEvent(buf, sig, webhookSigningSecret!); 
    console.log(`[API StripeWebhook] Event constructed: ${event.type}`);
  } catch (err: any) {
    console.error(`[API StripeWebhook] ⚠️ Webhook signature verification failed:`, err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  switch (event.type) {
    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      console.log(`[API StripeWebhook] ✅ PaymentIntent Succeeded: ${paymentIntent.id}`);

      const user_email = paymentIntent.metadata?.user_email;
      const purchased_tier = paymentIntent.metadata?.purchased_tier as 'standard_lifetime' | 'premium_lifetime' | undefined;

      if (!user_email || !purchased_tier) {
        console.error(`[API StripeWebhook] ⚠️ Missing user_email or purchased_tier in metadata for PI: ${paymentIntent.id}`);
        return res.status(200).json({ received: true, error: 'Missing required metadata (email or tier)' });
      }

      // Validate purchased_tier value
      let newAccessLevel: 'standard_lifetime' | 'premium_lifetime';
      if (purchased_tier === 'standard_lifetime') {
        newAccessLevel = 'standard_lifetime';
      } else if (purchased_tier === 'premium_lifetime') {
        newAccessLevel = 'premium_lifetime';
      } else {
        console.error(`[API StripeWebhook] ⚠️ Invalid purchased_tier value: ${purchased_tier} for PI: ${paymentIntent.id}`);
        return res.status(200).json({ received: true, error: 'Invalid tier specified in payment.' });
      }

      try {
        console.log(`[API StripeWebhook] Updating user ${user_email} to access_level: ${newAccessLevel}, status: 'paid', has_paid: true`);
        const { error: updateError } = await supabaseAdmin
          .from('users')
          .update({ 
            has_paid: true, 
            status: 'paid', 
            access_level: newAccessLevel, 
            stripe_customer_id: typeof paymentIntent.customer === 'string' ? paymentIntent.customer : null 
          })
          .eq('email', user_email);

        if (updateError) {
          console.error(`[API StripeWebhook] Supabase update error for ${user_email}:`, updateError.message);
          throw new Error(`Supabase update error: ${updateError.message}`);
        }
        console.log(`[API StripeWebhook] 💾 Database updated for ${user_email} with access_level: ${newAccessLevel}`);

        const { data: userData } = await supabaseAdmin.from('users').select('suds_initial').eq('email', user_email).single();

        const emailSubject = `Your Reconsolidation Program Access Updated!`;
        const emailBody = `
          <p>Thank you for your purchase!</p>
          <p>Your access to "The Reconsolidation Program - ${newAccessLevel.replace(/_/g, ' ')}" is now active.</p>
          ${userData?.suds_initial !== undefined ? `<p>Your initial SUDS (from setup): ${userData.suds_initial}</p>` : ''}
          <p>You can now access your treatments.</p>
        `;
        await resend.emails.send({
          from: 'Dev <dev@reprogrammingmind.com>',
          to: [user_email], subject: emailSubject, html: emailBody,
        });
        console.log(`[API StripeWebhook] 📧 Confirmation email sent to ${user_email} for ${newAccessLevel}.`);

      } catch (processingError: any) {
        console.error(`[API StripeWebhook] 🚨 Error processing payment_intent.succeeded for ${user_email}:`, processingError.message);
        return res.status(200).json({ received: true, error: `Internal processing failed: ${processingError.message}` });
      }
      break;

    case 'payment_intent.payment_failed':
      const paymentIntentFailed = event.data.object as Stripe.PaymentIntent;
      console.log(`[API StripeWebhook] ❌ PaymentIntent Failed: ${paymentIntentFailed.id}. Reason: ${paymentIntentFailed.last_payment_error?.message}`);
      break;

    default:
      console.log(`[API StripeWebhook] 🤷‍♀️ Unhandled event type: ${event.type}`);
  }

  res.status(200).json({ received: true });
}