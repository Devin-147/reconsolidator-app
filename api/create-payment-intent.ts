// FILE: api/create-payment-intent.ts
import Stripe from 'stripe';
import type { VercelRequest, VercelResponse } from '@vercel/node';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!stripeSecretKey) { return res.status(500).json({ error: 'Server config error (Stripe key).' }); }
  let stripe: Stripe;
  try {
       stripe = new Stripe(stripeSecretKey, { apiVersion: '2025-05-28.basil' }); // <<< CORRECTED API VERSION
  } catch (initError: any) {
       return res.status(500).json({ error: `Payment init failed: ${initError.message}` });
  }
  if (req.method !== 'POST') { return res.status(405).end('Method Not Allowed'); }
  try {
    const { amount, currency = 'usd', email, name, sudsInitial, sudsFinal, purchasedTier } = req.body || {};
    if (!amount || typeof amount !== 'number' || amount <= 0 || !email || typeof email !== 'string' || !purchasedTier || typeof purchasedTier !== 'string') {
      return res.status(400).json({ error: 'Missing/invalid payment info (amount, email, purchasedTier).' });
    }
    const metadata: Stripe.MetadataParam = { user_email: email, user_name: typeof name === 'string' ? name : '', suds_initial: sudsInitial != null ? String(sudsInitial) : 'N/A', suds_final: sudsFinal != null ? String(sudsFinal) : 'N/A', purchased_tier: purchasedTier };
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount, currency: currency, automatic_payment_methods: { enabled: true },
      metadata: metadata, receipt_email: email, description: `Recon Program - ${purchasedTier.replace(/_/g, ' ')}`,
    });
    res.status(200).json({ clientSecret: paymentIntent.client_secret, paymentIntentId: paymentIntent.id });
  } catch (error: unknown) {
    let errMsg = 'Unknown PI error.';
    if (error instanceof Stripe.errors.StripeError) { errMsg = `Stripe Error (${error.code || 'N/A'}): ${error.message}`; }
    else if (error instanceof Error) { errMsg = error.message; }
    res.status(500).json({ error: `Internal Server Error: ${errMsg}` });
  }
}