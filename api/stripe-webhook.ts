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
let stripe: Stripe, resend: Resend, supabaseAdmin: SupabaseClient, globalInitError: string | null = null;

try {
  if (!stripeSecretKey) throw new Error('STRIPE_SECRET_KEY missing.');
  stripe = new Stripe(stripeSecretKey, { apiVersion: '2025-05-28.basil' }); // <<< CORRECTED API VERSION
  if (!webhookSigningSecret) throw new Error('STRIPE_WEBHOOK_SECRET missing.');
  if (!resendApiKey) throw new Error('RESEND_API_KEY missing.');
  resend = new Resend(resendApiKey);
  if (!supabaseUrl || !supabaseServiceKey) throw new Error('SUPABASE_URL or SUPABASE_SERVICE_KEY missing.');
  supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, { auth: { persistSession: false } });
} catch (e: any) { globalInitError = `Webhook Init Error: ${e.message}`; }

export const config = { api: { bodyParser: false }};
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (globalInitError || !stripe || !resend || !supabaseAdmin) return res.status(500).json({ error: globalInitError || "Server config error." });
  if (req.method !== 'POST') return res.status(405).end('Method Not Allowed');
  const sig = req.headers['stripe-signature'] as string; let event: Stripe.Event;
  try { const buf = await buffer(req); event = stripe.webhooks.constructEvent(buf, sig, webhookSigningSecret!); } 
  catch (err: any) { return res.status(400).send(`Webhook Error: ${err.message}`); }

  switch (event.type) {
    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      const user_email = paymentIntent.metadata?.user_email;
      const purchased_tier = paymentIntent.metadata?.purchased_tier as 'standard_lifetime' | 'premium_lifetime' | undefined;
      if (!user_email || !purchased_tier || !['standard_lifetime', 'premium_lifetime'].includes(purchased_tier) ) return res.status(200).json({ received: true, error: 'Missing/invalid metadata.' });
      try {
        const { error: updateError } = await supabaseAdmin.from('users').update({ has_paid: true, status: 'paid', access_level: purchased_tier, stripe_customer_id: typeof paymentIntent.customer === 'string' ? paymentIntent.customer : paymentIntent.customer?.id || null }).eq('email', user_email);
        if (updateError) throw new Error(`Supabase update error: ${updateError.message}`);
        await resend.emails.send({ from: 'Dev <dev@reprogrammingmind.com>', to: [user_email], subject: `Access Updated: ${purchased_tier.replace('_', ' ')}`, html: `<p>Thank you! Your access to "The Reconsolidation Program - ${purchased_tier.replace('_', ' ')}" is active.</p>` });
      } catch (processingError: any) { return res.status(200).json({ received: true, error: `Internal processing fail: ${processingError.message}` }); }
      break;
    // ... other cases ...
  }
  res.status(200).json({ received: true });
}