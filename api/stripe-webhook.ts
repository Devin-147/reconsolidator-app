// FILE: api/stripe-webhook.ts

import Stripe from 'stripe';
import { Resend } from 'resend';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { buffer } from 'micro';
import type { VercelRequest, VercelResponse } from '@vercel/node';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const webhookSigningSecret = process.env.STRIPE_WEBHOOK_SECRET;
const resendApiKey = process.env.RESEND_API_KEY;
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

let stripe: Stripe;
let resend: Resend;
let supabaseAdmin: SupabaseClient;
let globalInitError: string | null = null;

try {
  if (!stripeSecretKey) throw new Error('STRIPE_SECRET_KEY missing.');
  stripe = new Stripe(stripeSecretKey, { apiVersion: '2024-05-28.basil' }); // Consistent API version
  if (!webhookSigningSecret) throw new Error('STRIPE_WEBHOOK_SECRET missing.');
  if (!resendApiKey) throw new Error('RESEND_API_KEY missing.');
  resend = new Resend(resendApiKey);
  if (!supabaseUrl || !supabaseServiceKey) throw new Error('SUPABASE_URL or SUPABASE_SERVICE_KEY missing.');
  supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false, autoRefreshToken: false }
  });
  console.log("[API StripeWebhook] Clients initialized.");
} catch (e: any) {
  globalInitError = `Webhook Init Error: ${e.message}`;
  console.error(globalInitError, e);
}

export const config = { api: { bodyParser: false }};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (globalInitError || !stripe || !resend || !supabaseAdmin) {
    console.error("[API StripeWebhook] Handler critical init failure:", globalInitError);
    return res.status(500).json({ error: globalInitError || "Server config error." });
  }
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end('Method Not Allowed');
  }

  const sig = req.headers['stripe-signature'] as string;
  let event: Stripe.Event;
  try {
    const buf = await buffer(req);
    event = stripe.webhooks.constructEvent(buf, sig, webhookSigningSecret!); 
  } catch (err: any) {
    console.error(`[API StripeWebhook] Webhook signature verify failed:`, err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }
  console.log(`[API StripeWebhook] Event received: ${event.type}`);

  switch (event.type) {
    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      console.log(`[API StripeWebhook] PaymentIntent Succeeded: ${paymentIntent.id}`);
      const user_email = paymentIntent.metadata?.user_email;
      const purchased_tier = paymentIntent.metadata?.purchased_tier as 'standard_lifetime' | 'premium_lifetime' | undefined;

      if (!user_email || !purchased_tier || !['standard_lifetime', 'premium_lifetime'].includes(purchased_tier) ) {
        console.error(`[API StripeWebhook] Missing/invalid metadata. Email: ${user_email}, Tier: ${purchased_tier}, PI: ${paymentIntent.id}`);
        return res.status(200).json({ received: true, error: 'Missing or invalid metadata.' });
      }
      try {
        console.log(`[API StripeWebhook] Updating user ${user_email} to access_level: ${purchased_tier}`);
        const { error: updateError } = await supabaseAdmin
          .from('users').update({ 
            has_paid: true, status: 'paid', access_level: purchased_tier, 
            stripe_customer_id: typeof paymentIntent.customer === 'string' ? paymentIntent.customer : paymentIntent.customer?.id || null 
          }).eq('email', user_email);
        if (updateError) throw new Error(`Supabase update error: ${updateError.message}`);
        console.log(`[API StripeWebhook] DB updated for ${user_email}.`);
        
        const emailSubject = `Access Updated: Reconsolidation Program - ${purchased_tier.replace('_', ' ')}`;
        const emailBody = `<p>Thank you! Your access to "The Reconsolidation Program - ${purchased_tier.replace('_', ' ')}" is active.</p>`;
        await resend.emails.send({ from: 'Dev <dev@reprogrammingmind.com>', to: [user_email], subject: emailSubject, html: emailBody });
        console.log(`[API StripeWebhook] Confirmation email sent to ${user_email}.`);
      } catch (processingError: any) {
        console.error(`[API StripeWebhook] Error processing PI success for ${user_email}:`, processingError.message);
        return res.status(200).json({ received: true, error: `Internal processing fail: ${processingError.message}` });
      }
      break;
    case 'payment_intent.payment_failed':
      const piFailed = event.data.object as Stripe.PaymentIntent;
      console.log(`[API StripeWebhook] PaymentIntent Failed: ${piFailed.id}. Reason: ${piFailed.last_payment_error?.message}`);
      break;
    default:
      console.log(`[API StripeWebhook] Unhandled event: ${event.type}`);
  }
  res.status(200).json({ received: true });
}