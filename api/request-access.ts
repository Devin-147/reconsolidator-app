// api/request-access.ts
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import type { VercelRequest, VercelResponse } from '@vercel/node';

// --- CONFIGURATION ---
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;
const resendApiKey = process.env.RESEND_API_KEY;
const verifiedSenderEmail = 'Dev <dev@reprogrammingmind.com>'; // Adjust as needed

// --- Determine Base URL Dynamically ---
const deploymentUrl = process.env.VERCEL_URL;
const protocol = deploymentUrl ? 'https' : 'http';
const host = deploymentUrl || 'localhost:3000';
const appBaseUrl = `${protocol}://${host}/`;
// --- End Base URL Determination ---


// --- Initialize Supabase Admin Client ---
let supabaseAdmin: SupabaseClient | null = null;
let supabaseInitError: string | null = null;

// Check required env vars *before* trying to create client
if (!supabaseUrl || !supabaseServiceKey) {
  supabaseInitError = 'Internal server configuration error: Missing Supabase URL or Service Key.';
  console.error('API Error init: Missing SUPABASE_URL or SUPABASE_SERVICE_KEY');
} else {
  try {
    // --- FIX: Pass arguments to createClient ---
    supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false, autoRefreshToken: false }
    });
    // --- END FIX ---
    console.log("Supabase Admin Client potentially initialized."); // Added log
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

  // --- FIX: Check for supabaseAdmin null *explicitly* after checking initError ---
  // This check now guarantees supabaseAdmin is non-null if we proceed
  if (supabaseInitError || !supabaseAdmin) {
      console.error(`API Error: Supabase admin client is not available. Error: ${supabaseInitError || 'Initialization failed silently.'}`);
      return res.status(500).json({ error: supabaseInitError || 'Supabase admin client not available.' });
  }
  // --- END FIX ---

  const { email } = req.body;
  if (!email || !/\S+@\S+\.\S+/.test(email)) { return res.status(400).json({ error: 'Valid email is required.' }); }
  // --- End Checks ---

  const resend = new Resend(resendApiKey);

  try {
    // --- Save/Update email in Supabase using ADMIN CLIENT ---
    // Now safe to use supabaseAdmin without null check here
    console.log(`Attempting upsert for ${email} using SERVICE KEY client...`);
    const { error: upsertError } = await supabaseAdmin
      .from('users')
      .upsert({ email: email, status: 'trial_requested', has_paid: false }, { onConflict: 'email' });

    if (upsertError) { console.error(`Supabase upsert error for ${email}:`, upsertError); throw new Error(`Database upsert error (${upsertError.code || 'Unknown'}): ${upsertError.message}`); }
    console.log(`User upserted/updated successfully in Supabase: ${email}`);

    // --- Send Welcome Email ---
    try {
      const subject = "Welcome - Start Your Treatment Setup";
      const bodyHtml = `<p>Welcome! Please use this link to begin setting up your first treatment:</p><p><a href="${appBaseUrl}">Begin Treatment Setup</a></p><p>(If clicking doesn't work, please copy and paste this URL into your browser: ${appBaseUrl})</p>`;

      const { data, error: emailError } = await resend.emails.send({ from: verifiedSenderEmail, to: [email], subject: subject, html: bodyHtml, });
      if (emailError) throw emailError;
      console.log(`Welcome email sent to ${email}. Resend ID: ${data?.id}`);
    } catch (emailError: unknown) { /* ... handle Resend error ... */ throw new Error(`Resend Error: ...`); }

    // --- Return Success ---
    res.status(200).json({ message: 'Success: Access request received. Please check your email for the setup link!' });

  } catch (error: unknown) { /* ... handle main error ... */ }
}