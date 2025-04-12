// api/request-access.js
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

// Initialize Supabase (reads env vars set in Vercel)
const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL; // Use renamed or old
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY; // Use renamed or old
// const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY; // Add SERVICE_KEY to Vercel ENV VARS if using
const supabase = createClient(supabaseUrl, supabaseAnonKey); // Use service key if needed

// Initialize Resend (reads env vars set in Vercel)
const resendApiKey = process.env.RESEND_API_KEY;
const resend = new Resend(resendApiKey);
const verifiedSenderEmail = 'Dev <dev@reprogrammingmind.com>'; // !!! REPLACE with your verified Resend sender !!!

export default async function handler(req, res) {
  // Allow only POST requests
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end('Method Not Allowed');
  }

  // Check if required environment variables are set
   if (!supabaseUrl || !supabaseAnonKey || !resendApiKey || !verifiedSenderEmail.includes('@')) {
     console.error('API Error: Missing required environment variables (Supabase URL/Key, Resend Key/Sender)');
     return res.status(500).json({ error: 'Server configuration error.' });
   }

  const { email } = req.body;

  // Basic Email Validation
  if (!email || !/\S+@\S+\.\S+/.test(email)) {
    return res.status(400).json({ error: 'Valid email is required.' });
  }

  try {
    // --- Save email to Supabase ---
    const { data: existingUser, error: findError } = await supabase
      .from('users')
      .select('email')
      .eq('email', email)
      .maybeSingle();

    // Handle potential Supabase query errors (excluding 'not found')
    if (findError && findError.code !== 'PGRST116') { // PGRST116 = Row not found
      console.error('Supabase find error:', findError);
      throw new Error(`Database error: ${findError.message}`);
    }

    if (!existingUser) {
        const { error: insertError } = await supabase
          .from('users')
          .insert({
             email: email,
             status: 'trial_requested',
             has_paid: false
           });

        if (insertError) {
          console.error('Supabase insert error:', insertError);
          // Check for unique constraint violation explicitly
          if (insertError.code === '23505') {
             console.log(`Attempt to re-insert existing email (handled): ${email}`);
             // Allow proceeding to send email even if insert failed due to race condition/existing email
          } else {
            throw new Error(`Database insert error: ${insertError.message}`);
          }
        } else {
           console.log(`New user added to Supabase: ${email}`);
        }
    } else {
        console.log(`User already exists in Supabase: ${email}`);
    }

    // --- Send Welcome Email (No Verification Link Needed Now) ---
    try {
      const { data, error: emailError } = await resend.emails.send({
        from: verifiedSenderEmail, // Use the verified sender
        to: [email],
        subject: 'Welcome to Reconsolidator - Start Treatment 1!',
        html: `<p>Welcome!</p><p>You can now access Treatment 1. Please return to the app or use this link to get started: <a href="https://app.reprogrammingmind.com/start">Start Treatment 1</a></p>`,
      });

      if (emailError) {
         throw emailError; // Throw Resend specific error
      }
      console.log(`Welcome email sent to ${email}. Resend ID: ${data?.id}`);

    } catch (emailError) {
      console.error(`Resend error sending welcome email to ${email}:`, emailError);
      // Decide if this should be a fatal error for the request
      // For now, let's return success to the user, but log the email failure
      // return res.status(500).json({ error: `Could not send welcome email: ${emailError.message}` });
    }

    // --- Return Success ---
    res.status(200).json({ message: 'Access request received. Welcome!' });

  } catch (error) {
    console.error("Error in /api/request-access:", error);
    res.status(500).json({ error: `Server error: ${error.message}` });
  }
}
