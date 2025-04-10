// api/stripe-webhook.js
import Stripe from 'stripe';
import { Resend } from 'resend';
import { createClient } from '@supabase/supabase-js';
import { buffer } from 'micro'; // Vercel helper to read raw body

// Initialize Stripe
// IMPORTANT: Use Environment Variables in Vercel for keys!
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

// Initialize Resend
const resend = new Resend(process.env.RESEND_API_KEY);

// Initialize Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL; // Or Vercel env var
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY; // Or Vercel env var
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Tell Vercel not to parse the body, we need the raw body for Stripe verification
export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end('Method Not Allowed');
  }

  const sig = req.headers['stripe-signature'];
  const buf = await buffer(req); // Read the raw request body

  let event;

  // 1. Verify Webhook Signature
  try {
    event = stripe.webhooks.constructEvent(buf, sig, webhookSecret);
  } catch (err) {
    console.error(`⚠️ Webhook signature verification failed.`, err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // 2. Handle the event
  switch (event.type) {
    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object;
      console.log(`✅ PaymentIntent successful: ${paymentIntent.id}`);

      // Extract metadata
      const user_email = paymentIntent.metadata.user_email;
      const user_name = paymentIntent.metadata.user_name || '';
      const suds_initial = paymentIntent.metadata.suds_initial || 'N/A';
      const suds_final = paymentIntent.metadata.suds_final || 'N/A';
      const firstName = user_name.split(' ')[0] || 'User'; // Simple first name extraction

      if (!user_email) {
         console.error(`⚠️ Missing user_email in metadata for PaymentIntent: ${paymentIntent.id}`);
         break; // Don't proceed without email
      }

      // 3. Update Database (Supabase Example)
      try {
         // Assuming you have a table 'user_payments' with 'email' and 'has_paid' columns
         const { data, error: dbError } = await supabase
           .from('user_payments') // YOUR_TABLE_NAME
           .upsert({ email: user_email, has_paid: true }, { onConflict: 'email' }) // Insert or update if email exists
           .select(); // Optionally select the inserted/updated row

         if (dbError) {
           throw dbError;
         }
         console.log(`💾 Database updated for email: ${user_email}`, data);
      } catch (dbError) {
         console.error(`🚨 Database update error for ${user_email}:`, dbError.message);
         // Decide if you should still try to send email or return an error
         // For now, we'll log and continue to email attempt
      }


      // 4. Send Email using Resend
      try {
         const subject = "Your Reconsolidator Treatment Results & Access";
         const bodyHtml = `<p>Hi ${firstName},</p><p>Thank you for purchasing access!</p><p>SUDS Levels:</p><ul><li>Initial: ${suds_initial}</li><li>Final: ${suds_final}</li></ul><p>Access granted.</p>`;

         const data = await resend.emails.send({
           from: 'Reprogramming Mind <devin@reprogrammingmind.com>', // !!! REPLACE with your verified Resend sender !!!
           to: [user_email],
           subject: subject,
           html: bodyHtml,
         });

         console.log(`📧 Email sent successfully to ${user_email}. Resend ID: ${data.id}`);
      } catch (emailError) {
         console.error(`🚨 Error sending email via Resend to ${user_email}:`, emailError);
      }

      break; // End case 'payment_intent.succeeded'

    case 'payment_intent.payment_failed':
      const paymentIntentFailed = event.data.object;
      console.log(`❌ PaymentIntent failed: ${paymentIntentFailed.id}`);
      // Optional: Add logic here (e.g., notify admin)
      break;

    default:
      console.log(`🤷‍♀️ Unhandled event type ${event.type}`);
  }

  // 5. Return a 200 response to Stripe to acknowledge receipt
  res.status(200).json({ received: true });
}