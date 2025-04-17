// api/request-access.ts
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import type { VercelRequest, VercelResponse } from '@vercel/node'; // Import Vercel types

// Initialize Supabase URL/Key (Check existence before creating client)
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
// const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY; // Not needed for this specific API's logic

// Initialize Resend (Check existence)
const resendApiKey = process.env.RESEND_API_KEY;
const verifiedSenderEmail = 'Dev <dev@reprogrammingmind.com>'; // !!! REPLACE with your verified Resend sender !!!

export default async function handler(req: VercelRequest, res: VercelResponse) { // Added Types
  // Allow only POST requests
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end('Method Not Allowed');
  }

  // --- Check required environment variables FIRST ---
  if (!supabaseUrl || !supabaseAnonKey || !resendApiKey || !verifiedSenderEmail.includes('@')) {
    console.error('API Error in request-access: Missing required environment variables (Supabase URL/AnonKey, Resend Key/Sender)');
    return res.status(500).json({ error: 'Server configuration error.' });
  }
  // --- End Check ---

  // --- Initialize Supabase Client (Now safe after checks) ---
  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  // --- End Initialization ---

  // --- Initialize Resend Client (Now safe after checks) ---
  const resend = new Resend(resendApiKey);
  // --- End Initialization ---


  const { email } = req.body;

  // Basic Email Validation
  if (!email || !/\S+@\S+\.\S+/.test(email)) {
    return res.status(400).json({ error: 'Valid email is required.' });
  }

  try {
    // --- Save email to Supabase ---
    // Check if user exists first (using Anon key is fine here, subject to RLS if enabled for SELECT)
    // Note: RLS might prevent reading, but the insert/upsert logic handles conflicts.
    // Consider if you NEED to check existence explicitly or just let upsert handle it.
    // For simplicity, we rely on the 'insert' with potential conflict handling below.

    const { error: insertError } = await supabase
      .from('users')
      .insert({
         email: email,
         status: 'trial_requested', // Ensure this matches your table schema/logic
         has_paid: false            // Ensure this column name is correct
       })
      // Note: .upsert() might be safer if you want to ensure status/paid are updated
      // even if the user already exists. Example:
      // .upsert({ email: email, status: 'trial_requested', has_paid: false }, { onConflict: 'email' })

    if (insertError) {
      // Handle potential Supabase insert errors
      if (insertError.code === '23505') { // Unique constraint violation (email exists)
         console.log(`Attempt to insert existing email (handled by DB or proceed): ${email}`);
         // Decide if you need to do anything else, like fetching the existing user?
         // For now, we assume it's okay to proceed to sending the email again.
      } else {
        // Throw other database errors
        console.error('Supabase insert error:', insertError);
        throw new Error(`Database insert error: ${insertError.message}`);
      }
    } else {
       console.log(`New user added or already exists in Supabase: ${email}`);
    }


    // --- Send Welcome Email ---
    try {
      const { data, error: emailError } = await resend.emails.send({
        from: verifiedSenderEmail,
        to: [email],
        subject: 'Welcome to The Reconsolidation Program - Start Treatment 1!',
        html: `<p>Welcome!</p><p>You can now access Treatment 1. Please return to the app or use this link to get started: <a href="https://app.reprogrammingmind.com/treatment-1">Start Treatment 1</a></p>`, // Update link if needed
      });

      if (emailError) {
         throw emailError; // Let the main catch block handle Resend errors
      }
      console.log(`Welcome email sent to ${email}. Resend ID: ${data?.id}`);

    } catch (emailError: unknown) { // Catch Resend specific errors
        let errorMsg = 'Failed to send welcome email.';
        if (emailError instanceof Error) errorMsg = emailError.message;
        console.error(`Resend error sending welcome email to ${email}:`, emailError);
        // Decide if failure to send email should stop the success response
        // For now, we continue but maybe add logging or alternative flow
         throw new Error(`Resend Error: ${errorMsg}`); // Throw to main catch block
    }

    // --- Return Success ---
    // If we reached here, DB interaction was okay (or handled) and email sent
    res.status(200).json({ message: 'Access request received. Welcome!' });

  } catch (error: unknown) { // Catch errors from DB or Resend re-throw
    console.error(`Error processing access request for ${email}:`, error);
    let errorMessage = 'An unknown server error occurred.';
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === 'string') {
      errorMessage = error;
    }
    res.status(500).json({ error: `Server error: ${errorMessage}` });
  }
}