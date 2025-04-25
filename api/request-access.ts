// api/request-access.ts
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import type { VercelRequest, VercelResponse } from '@vercel/node';

// --- CONFIGURATION ---
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const resendApiKey = process.env.RESEND_API_KEY;
const verifiedSenderEmail = 'Dev <dev@reprogrammingmind.com>'; // Adjust Name/Email as needed

// --- Determine Base URL Dynamically ---
const deploymentUrl = process.env.VERCEL_URL;
const protocol = deploymentUrl ? 'https' : 'http';
const host = deploymentUrl || 'localhost:3000';
const appBaseUrl = `${protocol}://${host}/`;
// --- End Base URL Determination ---


// --- Initialize Supabase Admin Client ---
let supabaseAdmin: SupabaseClient | null = null;
let supabaseInitError: string | null = null;
if (!supabaseUrl || !supabaseServiceKey) {
  supabaseInitError = 'Internal server configuration error: Missing Supabase URL or Service Key.';
  console.error('API Error init: Missing SUPABASE_URL or SUPABASE_SERVICE_KEY');
} else {
  try {
    supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false, autoRefreshToken: false }
    });
    console.log("Supabase Admin Client potentially initialized.");
  } catch (e: unknown) { // Catch specific error
    supabaseInitError = 'Failed to initialize Supabase admin client.';
    console.error('API Error initializing Supabase admin client:', e instanceof Error ? e.message : e);
  }
}
// --- End Initialization ---


export default async function handler(req: VercelRequest, res: VercelResponse) {
  // --- Basic Checks ---
  if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return res.status(405).end('Method Not Allowed'); }
  if (!resendApiKey || !verifiedSenderEmail.includes('@')) { console.error('API Error: Missing Resend Key/Sender.'); return res.status(500).json({ error: 'Server configuration error (email setup).' }); }

  // Check for supabaseAdmin null explicitly after checking initError
  if (supabaseInitError || !supabaseAdmin) {
      console.error(`API Error: Supabase admin client is not available. Error: ${supabaseInitError || 'Initialization failed silently.'}`);
      return res.status(500).json({ error: supabaseInitError || 'Supabase admin client not available.' });
  }

  const { email } = req.body;
  if (!email || !/\S+@\S+\.\S+/.test(email)) { return res.status(400).json({ error: 'Valid email is required.' }); }
  // --- End Checks ---

  // Initialize Resend Client (safe after key check)
  const resend = new Resend(resendApiKey);

  try {
    // --- Save/Update email in Supabase using ADMIN CLIENT ---
    console.log(`Attempting upsert for ${email} using SERVICE KEY client...`);
    const { error: upsertError } = await supabaseAdmin
      .from('users')
      .upsert({ email: email, status: 'trial_requested', has_paid: false }, { onConflict: 'email' });

    if (upsertError) { console.error(`Supabase upsert error for ${email}:`, upsertError); throw new Error(`Database upsert error (${upsertError.code || 'Unknown'}): ${upsertError.message}`); }
    console.log(`User upserted/updated successfully in Supabase: ${email}`);

    // --- Send Welcome Email with Detailed Instructions ---
    try {
      const subject = "Welcome to the Reconsolidation Program!"; // Updated Subject

      // --- FULL UNTRUNCATED EMAIL BODY ---
      const bodyHtml = `
        <div style="font-family: sans-serif; line-height: 1.6; color: #E0E0E0; background-color: #0a0334; padding: 20px;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #060536; padding: 25px; border-radius: 5px; border: 1px solid #2e3be7;">
            <h2 style="color: #7be4da; text-align: center;">Welcome!</h2>
            <p style="font-size: 15px; color: #B0B0B0;">Wow, you made it!!</p>
            <p style="font-size: 15px; color: #B0B0B0;">First, let's get into the Reconsolidation Program.</p>
            <p style="font-size: 15px; color: #B0B0B0;">You'll be asked to briefly record the target event. This is to awaken some of the neural networks associated to the problem memory which in the app is called the target event. Recording your 'target event' / problem memory in <strong>under 3 minutes</strong> is required, but under one minute is good. Two short sentences can be enough.</p>
            <p style="font-size: 15px; color: #B0B0B0;">After that you are asked to tell a <strong>positive memory</strong> that happened before the event and one <strong>positive memory</strong> from after the event.</p>
            <p style="font-size: 15px; color: #B0B0B0;">The application is asking you for these:</p>
            <ul style="font-size: 15px; color: #B0B0B0; margin-left: 20px;">
              <li>Problem memory (Target Event)</li>
              <li>Pre-target positive memory</li>
              <li>Post-target positive memory</li>
            </ul>
            <p style="font-size: 15px; color: #B0B0B0;">The program is asking for your retrieval of that problem memory, only briefly, followed by your resource memories (pre and post), and designed in this way to have your brain begin to turn on the reconsolidation process.</p>
            <p style="font-size: 15px; color: #B0B0B0;">After that just let the app guide you through the processing steps. It might take you about twenty minutes to get through all the steps of one treatment and measure results (SUDS).</p>
            <p style="font-size: 15px; color: #B0B0B0;">After that a good night or two of sleep is required to let the work done on the targeted memory work to set in (reconsolidate).</p>
            <p style="font-size: 15px; color: #B0B0B0;">When you're ready, use the button below to activate your first treatment session.</p>
            <div style="text-align: center; margin-top: 25px; margin-bottom: 25px;">
              <a href="${appBaseUrl}" target="_blank" style="background-color: #15d5db; color: #0b135b; padding: 12px 25px; text-decoration: none; border-radius: 4px; font-size: 18px; font-weight: bold; border: 1px solid #2e3be7;">Activate Treatment</a>
            </div>
            <p style="font-size: 12px; color: #888888; text-align: center;">If the button doesn't work, copy and paste this URL into your browser: ${appBaseUrl}</p>
          </div>
        </div>
      `;
      // --- END FULL EMAIL BODY ---

      const { data, error: emailError } = await resend.emails.send({
        from: verifiedSenderEmail,
        to: [email],
        subject: subject,
        html: bodyHtml,
      });

      if (emailError) throw emailError;
      console.log(`Welcome email sent to ${email}. Resend ID: ${data?.id}`);

    } catch (emailError: unknown) {
        let errorMsg = 'Failed to send welcome email.';
        if (emailError instanceof Error) errorMsg = emailError.message;
        console.error(`Resend error sending welcome email to ${email}:`, emailError);
        // Decide if this error should prevent the overall success response
        throw new Error(`Resend Error: ${errorMsg}`);
    }

    // --- Return Success ---
    res.status(200).json({ message: 'Success: Access request received. Please check your email to start the setup!' });

  } catch (error: unknown) { // Catch errors from DB or Resend
    console.error(`Error processing access request for ${email}:`, error);
    let errorMessage = 'An unknown server error occurred.';
    if (error instanceof Error) errorMessage = error.message;
    else if (typeof error === 'string') errorMessage = error;
    res.status(500).json({ error: `Server error: ${errorMessage}` });
  }
}