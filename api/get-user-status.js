// api/get-user-status.js
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase (reads env vars set in Vercel)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
// IMPORTANT: For reading potentially sensitive 'has_paid' status, consider if Row Level Security (RLS)
// on Supabase allows the anon key to read this. If not, you MUST use the service key here.
// Let's assume anon key CAN read for now, but SERVICE KEY IS SAFER if RLS restricts reads.
// const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY; // Add SERVICE_KEY to Vercel ENV VARS if using
const supabase = createClient(supabaseUrl, supabaseAnonKey); // Use service key if needed: createClient(supabaseUrl, supabaseServiceKey)


export default async function handler(req, res) {
  // Allow only GET requests for fetching status
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).end('Method Not Allowed');
  }

  // --- How to identify the user? ---
  // Option A: Get email from query parameter (Simpler, but less secure for sensitive data)
  const { email } = req.query;

  // Option B: Use Vercel's authentication or a session management library
  // to securely get the logged-in user's ID/email on the backend.
  // This is more complex to set up initially but much more secure.
  // Example (Conceptual - requires Vercel auth setup or library like next-auth/iron-session adapted):
  // const session = await getSession({ req }); // Hypothetical session retrieval
  // if (!session || !session.user?.email) {
  //   return res.status(401).json({ error: 'Not authenticated' });
  // }
  // const email = session.user.email;
  // --- End Option B ---


  // Basic Email Validation (If using Option A)
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
      throw dbError; // Let generic error handler catch it
    }

    if (!user) {
      // User not found in database (never signed up via landing page)
      console.log(`User status check: Email ${email} not found.`);
      return res.status(404).json({ isAuthenticated: false, userStatus: 'none' });
    }

    // Determine status based on database values
    const hasPaid = user.has_paid === true;
    // Assuming 'status' field exists and might be 'trial_requested', 'active_trial', 'paid', etc.
    const hasTrialAccess = user.status === 'trial_requested' || user.status === 'active_trial' || hasPaid;

    let userStatus: 'none' | 'trial' | 'paid' = 'none';
    if (hasPaid) {
      userStatus = 'paid';
    } else if (hasTrialAccess) {
      userStatus = 'trial';
    }

    console.log(`User status check for ${email}: Found - Status=${userStatus}, Paid=${hasPaid}`);
    // Return status (isAuthenticated is true if found, status depends on paid flag)
    res.status(200).json({ isAuthenticated: true, userStatus: userStatus });

  } catch (error) {
    console.error(`Error in /api/get-user-status for ${email}:`, error);
    res.status(500).json({ error: `Server error: ${error.message}` });
  }
}