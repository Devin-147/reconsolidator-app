// api/create-payment-intent.js
import Stripe from 'stripe';

// Initialize Stripe with your SECRET KEY
// IMPORTANT: Use Environment Variables in Vercel for keys!
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  // Allow only POST requests
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end('Method Not Allowed');
  }

  try {
    // Get data from the request body sent by your React app
    const { amount, currency = 'usd', email, name, sudsInitial, sudsFinal } = req.body;

    // Basic validation (add more as needed)
    if (!amount || amount <= 0 || !email) {
      return res.status(400).json({ error: 'Missing required payment information.' });
    }

    // --- Metadata to store with the payment ---
    const metadata = {
      user_email: email,
      user_name: name || '', // Ensure name is at least an empty string
      suds_initial: sudsInitial || 'N/A',
      suds_final: sudsFinal || 'N/A',
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

  } catch (error: unknown) { // Added ': unknown'
    console.error('Error creating payment intent:', error);
    // Safely get the message
    let errorMessage = 'An unknown server error occurred.';
    if (error instanceof Error) {
      errorMessage = error.message; // Use message safely
    } else if (typeof error === 'string') {
      errorMessage = error;
    }
    res.status(500).json({ error: `Internal Server Error: ${errorMessage}` });
  }
}