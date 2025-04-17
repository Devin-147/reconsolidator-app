// api/get-user-status.ts
import { createClient } from '@supabase/supabase-js';
import type { VercelRequest, VercelResponse } from '@vercel/node'; // Import Vercel types

// --- Initialize Supabase Admin Client ---
// We use the Service Role Key here to bypass RLS for reading user status.
// Ensure SUPABASE_URL and SUPABASE_SERVICE_KEY are set in your environment variables.
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

let supabaseAdmin: ReturnType<typeof createClient> | null = null;
let initError: string | null = null;

if (!supabaseUrl || !supabaseServiceKey) {
  initError = 'Internal server configuration error: Missing Supabase URL or Service Key.';
  console.error('API Error in get-user-status: Missing SUPABASE_URL or SUPABASE_SERVICE_KEY environment variables');
} else {
  try {
    supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
            // Avoid persisting sessions on the server-side for the service key client
            persistSession: false,
            autoRefreshToken: false
        }
    });
  } catch (e) {
      initError = 'Failed to initialize Supabase admin client.';
      console.error('API Error initializing Supabase admin client:', e);
  }
}
// --- End Initialization ---


export default async function handler(req: VercelRequest, res: VercelResponse) {

  // Check if client initialization failed earlier
  if (initError || !supabaseAdmin) {
    return res.status(500).json({ error: initError || 'Supabase admin client not available.' });
  }

  // Allow only GET requests for fetching status
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).end('Method Not Allowed');
  }

  // Get email from query parameter
  const email = typeof req.query.email === 'string' ? req.query.email : undefined;

  // Basic Email Validation
  if (!email || !/\S+@\S+\.\S+/.test(email)) {
    return res.status(400).json({ error: 'Valid email parameter is required.' });
  }


  try {
    // Query Supabase 'users' table using the ADMIN client (bypasses RLS)
    const { data: user, error: dbError } = await supabaseAdmin // <-- USE ADMIN CLIENT
      .from('users') // Your table name
      .select('email, has_paid, status') // Select relevant columns
      .eq('email', email)
      .maybeSingle(); // Get one user or null

    if (dbError) {
      // Log Supabase-specific errors
      console.error(`Supabase error fetching status for ${email}:`, dbError);
      // Throw the error to be caught by the generic catch block
      throw new Error(`Database query failed: ${dbError.message}`);
    }

    if (!user) {
      // User genuinely not found in database
      console.log(`User status check: Email ${email} not found.`);
      // Return a specific status indicating not found, but request was successful
      return res.status(200).json({ isAuthenticated: false, userStatus: 'not_found' }); // Changed status to 'not_found'
    }

    // Determine status based on database values
    const hasPaid = user.has_paid === true;
    const hasTrialAccess = user.status === 'trial_requested' || user.status === 'active_trial' || hasPaid; // Assuming these statuses grant access

    let userStatus = 'none'; // Default status if no specific condition met

    if (hasPaid) {
      userStatus = 'paid';
    } else if (hasTrialAccess) {
      // Could differentiate between requested and active trial if needed
      userStatus = 'trial';
    }
     // Add more conditions here if you have other statuses like 'expired', 'cancelled' etc.


    console.log(`User status check for ${email}: Found - Status=${userStatus}, Paid=${hasPaid}`);
    // Return status - isAuthenticated reflects finding the user record
    res.status(200).json({ isAuthenticated: true, userStatus: userStatus });

  } catch (error: unknown) { // Generic catch block
    console.error(`Error processing /api/get-user-status for ${email}:`, error);

    let errorMessage = 'An unknown server error occurred.';
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === 'string') {
      errorMessage = error;
    }
    // Return 500 for internal errors
    res.status(500).json({ error: `Server error: ${errorMessage}` });
  }
}