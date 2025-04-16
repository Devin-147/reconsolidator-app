// api/stripe-webhook.ts
import Stripe from 'stripe';
import { Resend } from 'resend';
import { createClient } from '@supabase/supabase-js';
import { buffer } from 'micro';
import type { VercelRequest, VercelResponse } from '@vercel/node'; // Import Vercel types

// --- Initialize Clients ---

// Stripe
const stripeSecret = process.env.STRIPE_SECRET_KEY;
if (!stripeSecret) {
  // Log error and exit if critical env var is missing
  console.error('FATAL ERROR: Missing STRIPE_SECRET_KEY environment variable');
  process.exit(1); // Or handle more gracefully depending on needs
}
const stripe = new Stripe(stripeSecret);
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
if (!webhookSecret) {
  console.error('FATAL ERROR: Missing STRIPE_WEBHOOK_SECRET environment variable');
  process.exit(1);
}

// Resend
const resendApiKey = process.env.RESEND_API_KEY;
if (!resendApiKey) {
  console.error('FATAL ERROR: Missing RESEND_API_KEY environment variable');
  process.exit(1);
}
const resend = new Resend(resendApiKey);

// Supabase (using Service Role Key for backend operations)
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Use Service Key!

if (!supabaseUrl) {
  console.error('FATAL ERROR: Missing SUPABASE_URL environment variable');
  process.exit(1);
}
if (!supabaseServiceKey) {
  console.error('FATAL ERROR: Missing SUPABASE_SERVICE_ROLE_KEY environment variable');
  process.exit(1);
}
// Initialize Supabase client with Service Role Key
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

// --- Vercel Config ---
export const config = {
  api: {
    bodyParser: false, // We need the raw body for Stripe verification
  },
};

// --- Webhook Handler ---
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end('Method Not Allowed');
  }

  const sig = req.headers['stripe-signature'] as string; // Assert as string
  let event: Stripe.Event;

  // Corrected catch block for signature verification
  try {
    const buf = await buffer(req); // Read the raw request body
    event = stripe.webhooks.constructEvent(buf, sig, webhookSecret);
  } catch (error: unknown) { // Added ': unknown'
    let errorMessage = 'Unknown webhook signature verification error.';
    if (error instanceof Error) {
      errorMessage = error.message; // Use message safely
    }
    console.error(`⚠️ Webhook signature verification failed: ${errorMessage}`);
    return res.status(400).send(`Webhook Error: ${errorMessage}`);
  }

  // --- Handle the specific event type ---
  switch (event.type) {
    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      console.log(`✅ PaymentIntent successful: ${paymentIntent.id}`);

      // Get user email from metadata (MUST be set when creating PaymentIntent)
      const user_email = paymentIntent.metadata?.user_email;

      if (!user_email) {
        console.error(`⚠️ Missing user_email in metadata for PaymentIntent: ${paymentIntent.id}`);
        // Respond 200 to Stripe, but log error and don't process further
        return res.status(200).json({ received: true, error: 'Missing user email in metadata' });
      }

      // Declared variables BEFORE try block where they are used
      let firstName = 'Valued User'; // Default first name
      let suds_initial: number | string = 'N/A'; // Default SUDS
      let suds_final: number | string = 'N/A';   // Default SUDS

      // Corrected catch block for main processing
      try {
        // 1. Fetch user data (including SUDS) from Supabase using the email
        const { data: userData, error: fetchError } = await supabaseAdmin
          .from('users') // Your users table
          // Ensure these columns exist in your 'users' table!
          // Remove 'firstName' from select if you didn't add the column
          .select('id, email, firstName, has_paid, status, suds_initial, suds_final')
          .eq('email', user_email)
          .single(); // Expect exactly one user

        if (fetchError) {
          console.error(`Supabase fetch error for ${user_email}:`, fetchError.message);
          // Decide if you should proceed without SUDS/firstName or stop
        } else if (userData) {
          console.log(`User data fetched for ${user_email}:`, userData);
          // Assign variables fetched from DB
          // Only assign firstName if the column exists and has a value
          if (userData.firstName) {
             firstName = userData.firstName;
          }
          suds_initial = userData.suds_initial ?? suds_initial; // Use ?? for potential 0 values
          suds_final = userData.suds_final ?? suds_final;
        } else {
            console.warn(`User not found in Supabase for email ${user_email} during webhook.`);
        }

        // 2. Update user's payment status in Supabase
        const { error: updateError } = await supabaseAdmin
          .from('users') // Update the 'users' table
          .upsert(
            {
              email: user_email,
              has_paid: true,
              status: 'paid',
              stripe_customer_id: typeof paymentIntent.customer === 'string' ? paymentIntent.customer : null
            },
            { onConflict: 'email' }
          );

        if (updateError) {
          throw new Error(`Supabase update error: ${updateError.message}`);
        }
        console.log(`💾 Database updated for email: ${user_email}`);

        // 3. Send Confirmation/Results Email using Resend
        const subject = "Your Reconsolidator Treatment Results & Access";
        // Removed firstName from the greeting
        const bodyHtml = `<p>Thank you for purchasing access!</p>
                          <p>Your results from the initial treatment:</p>
                          <ul>
                            <li>Initial SUDS: ${suds_initial}</li>
                            <li>Final SUDS: ${suds_final}</li>
                          </ul>
                          <p>Your access to further treatments is now active.</p>`;

        // Correctly handle Resend response and access ID
        const { data: emailData, error: emailError } = await resend.emails.send({
          from: 'Founder <founder@reprogrammingmind.com>', // !! USE YOUR VERIFIED SENDER !!
          to: [user_email],
          subject: subject,
          html: bodyHtml,
        });

        if (emailError) {
          console.error(`Resend error for ${user_email}:`, emailError);
          // Throw error to be caught by outer catch block
          throw new Error(`Failed to send email: ${emailError.message || 'Unknown Resend error'}`);
        }

        if (emailData) {
           // Access ID correctly via emailData.id
           console.log(`📧 Email sent successfully to ${user_email}. Resend ID: ${emailData.id}`);
        }

      } catch (error: unknown) { // Added ': unknown'
        let errorMessage = 'Unknown error during payment processing.';
        if (error instanceof Error) {
          errorMessage = error.message; // Use message safely
        }
        console.error(`🚨 Processing error for ${user_email} in payment_intent.succeeded: ${errorMessage}`);
        // Don't send 500 to Stripe, they might retry. Log it and return 200.
        return res.status(200).json({ received: true, error: `Processing failed: ${errorMessage}` });
      }

      break; // End case 'payment_intent.succeeded'

    // --- Handle other event types ---
    case 'payment_intent.payment_failed':
      const paymentIntentFailed = event.data.object as Stripe.PaymentIntent;
      console.log(`❌ PaymentIntent failed: ${paymentIntentFailed.id}`);
      break;

    default:
      console.log(`🤷‍♀️ Unhandled event type ${event.type}`);
  }

  // --- Acknowledge receipt to Stripe ---
  console.log("Webhook handled successfully, returning 200 to Stripe.");
  res.status(200).json({ received: true });
}