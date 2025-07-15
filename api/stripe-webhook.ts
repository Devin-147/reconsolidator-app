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
let stripe: Stripe, resend: Resend, supabaseAdmin: SupabaseClient, initError: string | null = null;
try {
  if (!stripeSecretKey || !webhookSigningSecret || !resendApiKey || !supabaseUrl || !supabaseServiceKey) throw new Error('One or more required environment variables are missing.');
  stripe = new Stripe(stripeSecretKey, { apiVersion: '2025-05-28.basil' }); // <<< CORRECTED
  resend = new Resend(resendApiKey);
  supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, { auth: { persistSession: false } });
} catch (e: any) { initError = e.message; }

export const config = { api: { bodyParser: false }};
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (initError) return res.status(500).json({ error: `Webhook Init Error: ${initError}` });
  if (req.method !== 'POST') return res.status(405).setHeader('Allow', 'POST').end('Method Not Allowed');
  const sig = req.headers['stripe-signature'] as string; let event: Stripe.Event;
  try { const buf = await buffer(req); event = stripe.webhooks.constructEvent(buf, sig, webhookSigningSecret!); } 
  catch (err: any) { return res.status(400).send(`Webhook Error: ${err.message}`); }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const paymentIntent = await stripe.paymentIntents.retrieve(session.payment_intent as string);
    const userEmail = paymentIntent.metadata?.user_email;
    const priceId = paymentIntent.metadata?.price_id;

    let accessLevel: 'standard_lifetime' | 'premium_lifetime' | undefined;
    if (priceId === 'price_1R4vocGlRHehBfcVWr0xTMI1') { accessLevel = 'standard_lifetime'; }
    else if (priceId === 'price_1RXmGLGlRHehBfcVIjMA7Vu4') { accessLevel = 'premium_lifetime'; }

    if (!userEmail || !accessLevel) {
      console.error("Webhook received with missing metadata:", { userEmail, priceId });
      return res.status(200).json({ received: true, error: 'Missing required metadata for fulfillment.' });
    }
    try {
      const { error } = await supabaseAdmin.from('users').update({ has_paid: true, status: 'paid', access_level: accessLevel, stripe_customer_id: typeof session.customer === 'string' ? session.customer : null }).eq('email', userEmail);
      if (error) throw new Error(`Supabase update error: ${error.message}`);
      await resend.emails.send({ from: 'Dev <dev@reprogrammingmind.com>', to: [userEmail], subject: 'Your Access Has Been Upgraded!', html: `<p>Thank you for your purchase! Your access level is now: ${accessLevel.replace('_', ' ')}.</p>` });
    } catch (e: any) { return res.status(200).json({ received: true, error: `Fulfillment error: ${e.message}` }); }
  }
  res.status(200).json({ received: true });
}