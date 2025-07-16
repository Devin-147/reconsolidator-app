// FILE: api/create-checkout-session.ts
// Corrected Stripe API version.

import Stripe from 'stripe';
import type { VercelRequest, VercelResponse } from '@vercel/node';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
if (!stripeSecretKey) { throw new Error('STRIPE_SECRET_KEY is not set.'); }

// <<< CORRECTED API VERSION >>>
const stripe = new Stripe(stripeSecretKey, { apiVersion: '2025-05-28.basil' }); 

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') { return res.status(405).setHeader('Allow', 'POST').end('Method Not Allowed'); }
  try {
    const { priceId, userEmail, couponId } = req.body;

    if (!priceId || !userEmail) { return res.status(400).json({ error: 'Missing required parameters: priceId and userEmail.' }); }
    
    const success_url = `${req.headers['x-forwarded-proto']}://${req.headers.host}/treatment-1?session_id={CHECKOUT_SESSION_ID}`;
    const cancel_url = `${req.headers['x-forwarded-proto']}://${req.headers.host}/upgrade`;
    
    const sessionOptions: Stripe.Checkout.SessionCreateParams = {
        payment_method_types: ['card'],
        line_items: [{ price: priceId, quantity: 1 }],
        mode: 'payment',
        success_url: success_url,
        cancel_url: cancel_url,
        customer_email: userEmail,
        payment_intent_data: {
          metadata: { user_email: userEmail, price_id: priceId }
        },
    };

    if (couponId && typeof couponId === 'string') {
        sessionOptions.discounts = [{ coupon: couponId }];
    }

    const session = await stripe.checkout.sessions.create(sessionOptions);

    if (!session.url) { throw new Error("Stripe session created without a URL."); }
    res.status(200).json({ sessionId: session.id, url: session.url });

  } catch (error: any) {
    console.error("Stripe Checkout Session Error:", error.message);
    res.status(500).json({ error: `Internal Server Error: ${error.message}` });
  }
}