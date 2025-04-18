// api/create-payment-intent.ts
import Stripe from 'stripe';
import type { VercelRequest, VercelResponse } from '@vercel/node'; // Import Vercel types

// Get the secret key, but DO NOT initialize Stripe yet
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

export default async function handler(req: VercelRequest, res: VercelResponse) { // Added types

  // --- Check Environment Variables FIRST ---
  if (!stripeSecretKey) {
    console.error('API Error in create-payment-intent: Missing STRIPE_SECRET_KEY environment variable');
    return res.status(500).json({ error: 'Server configuration error.' });
  }
  // --- End Check ---

  // --- Initialize Stripe Client (Now safe after check) ---
  const stripe = new Stripe(stripeSecretKey, { // Second argument is the options object
    // apiVersion should NOT be in here
    typescript: true,         // Enable TypeScript support if using Stripe's TS features
    // Add other config options here if needed (e.g., timeout, httpAgent)
  });
  // The 'apiVersion' is often set globally when initializing stripe or passed per-request
  // For clarity and consistency using the recommended header method is often better,
  // but setting it here is also possible IF SUPPORTED by your Stripe library version.
  // However, the most common constructor signature takes (secretKey, config?).
  // Let's stick to the config object for now and ensure your Stripe lib is up to date.
  // If you still get errors, try removing the config object entirely:
  // const stripe = new Stripe(stripeSecretKey);
  // And rely on the default API version or set it globally.

  
  // --- End Initialization ---


  // Allow only POST requests
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end('Method Not Allowed');
  }

  try {
    // Get data from the request body sent by your React app
    // Added type safety: Ensure req.body exists and handle potential undefined values
    const { amount, currency = 'usd', email, name, sudsInitial, sudsFinal } = req.body || {};

    // Basic validation (add more as needed)
    if (!amount || typeof amount !== 'number' || amount <= 0 || !email || typeof email !== 'string') {
      // Log the received body for easier debugging if validation fails
      console.log("Validation failed. Received body:", req.body);
      return res.status(400).json({ error: 'Missing or invalid required payment information (amount, email).' });
    }

    // --- Metadata to store with the payment ---
    const metadata: Stripe.MetadataParam = { // Add Stripe type for metadata
      user_email: email,
      user_name: typeof name === 'string' ? name : '', // Ensure name is string or empty
      suds_initial: sudsInitial !== undefined && sudsInitial !== null ? String(sudsInitial) : 'N/A', // Convert to string
      suds_final: sudsFinal !== undefined && sudsFinal !== null ? String(sudsFinal) : 'N/A', // Convert to string
      // Add other relevant data here
    };

    // Create the PaymentIntent on Stripe
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount, // Amount should be in cents
      currency: currency,
      automatic_payment_methods: { enabled: true },
      metadata: metadata,
      receipt_email: email, // Optional: Stripe can send its own receipt
      description: 'Payment for The Reconsolidation Program Treatments',
    });

    // Send the client_secret back to the frontend
    res.status(200).json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id, // Optional, good for debugging
    });

  } catch (error: unknown) { // Catch block with unknown type
    console.error('Error creating payment intent:', error);

    let errorMessage = 'An unknown server error occurred.';
    // Check if it's a Stripe error first for more specific messages
    if (error instanceof Stripe.errors.StripeError) {
        errorMessage = `Stripe Error: ${error.message}`;
    } else if (error instanceof Error) {
        errorMessage = error.message;
    } else if (typeof error === 'string') {
        errorMessage = error;
    }
    res.status(500).json({ error: `Internal Server Error: ${errorMessage}` });
  }
}