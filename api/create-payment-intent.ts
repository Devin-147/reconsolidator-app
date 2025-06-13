// FILE: api/create-payment-intent.ts

import Stripe from 'stripe';
import type { VercelRequest, VercelResponse } from '@vercel/node';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!stripeSecretKey) {
    console.error('[API create-payment-intent] FATAL: Missing STRIPE_SECRET_KEY environment variable.');
    return res.status(500).json({ error: 'Server configuration error (Stripe key missing).' });
  }

  let stripe: Stripe;
  try {
       // Using the Stripe API version your TypeScript setup expects
       stripe = new Stripe(stripeSecretKey, { apiVersion: '2025-04-30.basil' }); 
       console.log("[API create-payment-intent] Stripe client initialized with apiVersion: '2025-04-30.basil'.");
  } catch (initError: any) { // Added type any for initError
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
      console.warn("[API create-payment-intent] Validation failed. Received body:", req.body);
      return res.status(400).json({ error: 'Missing or invalid payment information (amount, email, purchasedTier).' });
    }

    const metadata: Stripe.MetadataParam = {
      user_email: email,
      user_name: typeof name === 'string' ? name : '',
      suds_initial: sudsInitial !== undefined && sudsInitial !== null ? String(sudsInitial) : 'N/A',
      suds_final: sudsFinal !== undefined && sudsFinal !== null ? String(sudsFinal) : 'N/A',
      purchased_tier: purchasedTier,
    };
    console.log("[API create-payment-intent] Prepared metadata:", metadata);

    console.log(`[API create-payment-intent] Creating PaymentIntent for amount ${amount} ${currency}, tier ${purchasedTier}...`);
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount, 
      currency: currency,
      automatic_payment_methods: { enabled: true },
      metadata: metadata,
      receipt_email: email,
      description: `Reconsolidation Program - ${purchasedTier.replace(/_/g, ' ')} Access`, // Replaced underscore for display
    });
    console.log(`[API create-payment-intent] PaymentIntent created: ${paymentIntent.id}`);

    res.status(200).json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });

  } catch (error: unknown) {
    console.error('[API create-payment-intent] Error processing payment intent:', error);
    let errorMessage = 'Unknown server error creating payment intent.';
    if (error instanceof Stripe.errors.StripeError) { errorMessage = `Stripe Error (${error.code || 'N/A'}): ${error.message}`; }
    else if (error instanceof Error) { errorMessage = error.message; }
    res.status(500).json({ error: `Internal Server Error: ${errorMessage}` });
  }
}