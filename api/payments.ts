// FILE: api/payments.ts
// NEW: A consolidated endpoint for all Stripe payment actions.

import Stripe from 'stripe';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { buffer } from 'micro';
import type { VercelRequest, VercelResponse } from '@vercel/node';

// --- Initialize Clients ---
let stripe: Stripe;
let supabaseAdmin: SupabaseClient;
let webhookSecret: string;
const initError: string | null = null;

try {
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;
    webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';

    if (!stripeSecretKey || !supabaseUrl || !supabaseServiceKey || !webhookSecret) {
        throw new Error('One or more required environment variables are missing.');
    }
    stripe = new Stripe(stripeSecretKey, { apiVersion: '2024-04-10' });
    supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
} catch (e: any) {
    console.error("Initialization failed:", e.message);
    // initError will be checked in the handler
}

// --- Handler for Creating a Checkout Session ---
async function handleCreateCheckout(req: VercelRequest, res: VercelResponse) {
    const { priceId, userEmail } = req.body.payload;
    if (!priceId || !userEmail) {
        return res.status(400).json({ error: 'Missing priceId or userEmail.' });
    }
    const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [{ price: priceId, quantity: 1 }],
        mode: 'payment',
        success_url: `${req.headers.origin}/calibrate/1?payment_success=true`,
        cancel_url: `${req.headers.origin}/upgrade?payment_canceled=true`,
        customer_email: userEmail,
        metadata: {
            user_email: userEmail,
        }
    });
    return res.status(200).json({ sessionId: session.id });
}

// --- Handler for Processing Stripe Webhook Events ---
async function handleStripeWebhook(req: VercelRequest, res: VercelResponse) {
    const buf = await buffer(req);
    const sig = req.headers['stripe-signature'] as string;
    let event: Stripe.Event;

    try {
        event = stripe.webhooks.constructEvent(buf.toString(), sig, webhookSecret);
    } catch (err: any) {
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    if (event.type === 'checkout.session.completed') {
        const session = event.data.object as Stripe.Checkout.Session;
        const userEmail = session.customer_email || session.metadata?.user_email;
        
        if (!userEmail) {
            console.error("Webhook Error: Could not determine user email from session.");
            return res.status(400).send('Webhook Error: Missing user email.');
        }

        // Fetch price to determine access level
        const lineItems = await stripe.checkout.sessions.listLineItems(session.id, { limit: 1 });
        const priceId = lineItems.data[0]?.price?.id;

        // You must get these Price IDs from your Stripe Product Catalogue
        const PREMIUM_PRICE_ID = "price_1PPZgYJgJ...your...premium...id"; // Replace with your actual ID
        
        const accessLevel = (priceId === PREMIUM_PRICE_ID) ? 'premium_lifetime' : 'standard_lifetime';
        
        const { error } = await supabaseAdmin
            .from('users')
            .update({ access_level: accessLevel, has_paid: true, status: 'paid' })
            .eq('email', userEmail);
        
        if (error) {
            console.error("Supabase update error on webhook:", error);
            return res.status(500).send('Database error updating user.');
        }
    }
    return res.status(200).json({ received: true });
}

// --- Main API Router ---
export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (initError) {
        return res.status(500).json({ error: `API Initialization Failed: ${initError}` });
    }

    // Webhook requests are raw, other requests are JSON
    if (req.headers['stripe-signature']) {
        return await handleStripeWebhook(req, res);
    }

    const { action } = req.body;
    try {
        switch (action) {
            case 'createCheckout':
                return await handleCreateCheckout(req, res);
            default:
                return res.status(400).json({ error: 'Invalid action.' });
        }
    } catch (error: any) {
        return res.status(500).json({ error: error.message });
    }
}

// Vercel needs to know the webhook doesn't use the standard body parser
export const config = {
    api: {
        bodyParser: false,
    },
};
