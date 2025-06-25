// FILE: api/create-payment-intent.ts

import Stripe from 'stripe';
import type { VercelRequest, VercelResponse } from '@vercel/node';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!stripeSecretKey) {
    console.error('[API create-payment-intent] FATAL: Missing STRIPE_SECRET_KEY.');
    return res.status(500).json({ error: 'Server configuration error (Stripe key).' });
  }

  let stripe: Stripe;
  try {
       // Using a known stable or previously working Stripe API version
       stripe = new Stripe(stripeSecretKey, { apiVersion: '2024-04-10' }); 
       console.log("[API create-payment-intent] Stripe client initialized with apiVersion: '2024-05-28.basil'.");
  } catch (initError: any) {
       console.error('[API create-payment-intent] Error initializing Stripe client:', initError);
       return res.status(500).json({ error: `Failed to initialize payment processing: ${initError.message}` });
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end('Method Not Allowed');
  }

  try {
    const { 
        amount, 
        currency = 'usd', 
        email, 
        name, 
        sudsInitial, 
        sudsFinal,
        purchasedTier 
    } = req.body || {};

    if (!amount || typeof amount !== 'number' || amount <= 0 || 
        !email || typeof email !== 'string' ||
        !purchasedTier || typeof purchasedTier !== 'string') {
      console.warn("[API create-payment-intent] Validation failed. Body:", req.body);
      return res.status(400).json({ error: 'Missing/invalid payment info (amount, email, purchasedTier).' });
    }

    const metadata: Stripe.MetadataParam = {
      user_email: email,
      user_name: typeof name === 'string' ? name : '',
      suds_initial: sudsInitial !== undefined && sudsInitial !== null ? String(sudsInitial) : 'N/A',
      suds_final: sudsFinal !== undefined && sudsFinal !== null ? String(sudsFinal) : 'N/A',
      purchased_tier: purchasedTier,
    };
    
    console.log(`[API create-payment-intent] Creating PI for ${amount} ${currency}, tier ${purchasedTier}, email ${email}`);
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount, 
      currency: currency,
      automatic_payment_methods: { enabled: true },
      metadata: metadata,
      receipt_email: email,
      description: `Reconsolidation Program - ${purchasedTier.replace(/_/g, ' ')} Access`,
    });
    console.log(`[API create-payment-intent] PI created: ${paymentIntent.id}`);

    res.status(200).json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });

  } catch (error: unknown) {
    console.error('[API create-payment-intent] Error processing PI:', error);
    let errMsg = 'Unknown server error creating PI.';
    if (error instanceof Stripe.errors.StripeError) { errMsg = `Stripe Error (${error.code || 'N/A'}): ${error.message}`; }
    else if (error instanceof Error) { errMsg = error.message; }
    res.status(500).json({ error: `Internal Server Error: ${errMsg}` });
  }
}