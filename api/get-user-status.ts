// api/get-user-status.ts
import { createClient } from '@supabase/supabase-js';
import type { VercelRequest, VercelResponse } from '@vercel/node'; // Import Vercel types

export default async function handler(req: VercelRequest, res: VercelResponse) {

  // --- Check Environment Variables ---
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY; // Using Anon Key for read-only status check

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('API Error in get-user-status: Missing SUPABASE_URL or SUPABASE_ANON_KEY environment variables');
    return res.status(500).json({ error: 'Internal server configuration error.' });
  }
  // --- End Check ---

  // --- Initialize Supabase Client ---
  // Initialize inside handler is safer
  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  // --- End Initialization ---


  // Allow only GET requests for fetching status
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).end('Method Not Allowed');
  }

  // Get email from query parameter
  // Make sure the type is string or undefined
  const email = typeof req.query.email === 'string' ? req.query.email : undefined;

  // Basic Email Validation
  if (!email || !/\S+@\S+\.\S+/.test(email)) {
    return res.status(400).json({ error: 'Valid email parameter is required.' });
  }


  try {
    // Query Supabase 'users' table for the specified email
    const { data: user, error: dbError } = await supabase
      .from('users') // Your table name
      .select('email, has_paid, status') // Select relevant columns
      .eq('email', email)
      .maybeSingle(); // Get one user or null

    if (dbError) {
      console.error(`Supabase error fetching status for ${email}:`, dbError);
      throw dbError; // Let the main catch block handle it
    }

    if (!user) {
      // User not found in database
      console.log(`User status check: Email ${email} not found.`);
      return res.status(404).json({ isAuthenticated: false, userStatus: 'none' });
    }

    // Determine status based on database values
    const hasPaid = user.has_paid === true;
    // Assuming 'status' field exists and might be 'trial_requested', 'active_trial', 'paid', etc.
    const hasTrialAccess = user.status === 'trial_requested' || user.status === 'active_trial' || hasPaid;

    // Corrected line (simple JS)
    let userStatus = 'none';

    if (hasPaid) {
      userStatus = 'paid';
    } else if (hasTrialAccess) {
      userStatus = 'trial';
    }

    console.log(`User status check for ${email}: Found - Status=${userStatus}, Paid=${hasPaid}`);
    // Return status
    res.status(200).json({ isAuthenticated: true, userStatus: userStatus });

  // Corrected catch block with type check
  } catch (error: unknown) { // Added ': unknown'
    console.error(`Error in /api/get-user-status for ${email}:`, error); // Log the whole error

    // Safely get the message
    let errorMessage = 'An unknown server error occurred.';
    if (error instanceof Error) {
      errorMessage = error.message; // Use message if it's a standard Error object
    } else if (typeof error === 'string') {
      errorMessage = error; // Use message if a string was thrown
    }

    res.status(500).json({ error: `Server error: ${errorMessage}` }); // Use the safe message
  }
}