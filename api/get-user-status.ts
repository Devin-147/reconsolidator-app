// FILE: api/get-user-status.ts (Functional Version)

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { VercelRequest, VercelResponse } from '@vercel/node';

const supabaseUrl_env = process.env.SUPABASE_URL;
const supabaseServiceKey_env = process.env.SUPABASE_SERVICE_KEY;

let supabaseAdmin: SupabaseClient | null = null;
let initError: string | null = null;

if (typeof supabaseUrl_env !== 'string' || supabaseUrl_env.trim() === '') {
  initError = 'API Config Error: SUPABASE_URL env variable is missing or not a string for get-user-status.';
  console.error(`[API get-user-status] ${initError}`);
} else if (typeof supabaseServiceKey_env !== 'string' || supabaseServiceKey_env.trim() === '') {
  initError = 'API Config Error: SUPABASE_SERVICE_KEY env variable is missing or not a string for get-user-status.';
  console.error(`[API get-user-status] ${initError}`);
} else {
  try {
    supabaseAdmin = createClient(supabaseUrl_env, supabaseServiceKey_env, {
        auth: { persistSession: false, autoRefreshToken: false }
    });
  } catch (e: any) {
      initError = `Failed to initialize Supabase admin client for get-user-status: ${e.message}`;
      console.error('[API get-user-status] Supabase Client Init Catch Error:', e);
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (initError || !supabaseAdmin) {
    console.error("[API get-user-status] Handler error: Supabase client not available due to init error.", initError);
    return res.status(500).json({ error: initError || 'Supabase admin client setup failed on server.' });
  }

  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).end('Method Not Allowed');
  }

  const emailFromQuery = req.query.email;
  if (typeof emailFromQuery !== 'string' || !/\S+@\S+\.\S+/.test(emailFromQuery)) {
    return res.status(400).json({ error: 'Valid email parameter is required.' });
  }
  const email = emailFromQuery.trim();

  try {
    const { data: user, error: dbError } = await supabaseAdmin
      .from('users')
      .select('email, has_paid, status, access_level')
      .eq('email', email)
      .maybeSingle();

    if (dbError) {
      console.error(`[API get-user-status] Supabase DB error for ${email}:`, dbError);
      throw new Error(`Database query failed: ${dbError.message} (Code: ${dbError.code})`);
    }

    if (!user) {
      return res.status(200).json({ isAuthenticated: false, userStatus: 'not_found', accessLevel: 'not_found' });
    }
    
    let derivedUserStatus: 'paid' | 'trial' | 'none' | 'not_found' = 'none'; 
    if (user.has_paid === true || user.status === 'paid') { derivedUserStatus = 'paid'; }
    else if (user.status === 'trial_requested' || user.status === 'active_trial' || user.status === 'trial') { derivedUserStatus = 'trial'; }
    
    let userAccessLevelFromDB: 'trial' | 'standard_lifetime' | 'premium_lifetime' | 'none' | 'not_found' = 
        (user.access_level as any === 'paid' && user.has_paid === true) ? 'premium_lifetime' : // Handle old 'paid' as 'premium_lifetime'
        (user.access_level === 'standard_lifetime' || user.access_level === 'premium_lifetime' || user.access_level === 'trial') ? user.access_level : 'trial';

    if (!['trial', 'standard_lifetime', 'premium_lifetime', 'none', 'not_found'].includes(userAccessLevelFromDB)) {
        userAccessLevelFromDB = 'trial';
    }
    
    if (userAccessLevelFromDB === 'standard_lifetime' || userAccessLevelFromDB === 'premium_lifetime') { derivedUserStatus = 'paid'; }
    else if (userAccessLevelFromDB === 'trial') { derivedUserStatus = 'trial';}

    res.status(200).json({ isAuthenticated: true, userStatus: derivedUserStatus, accessLevel: userAccessLevelFromDB });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown server error.';
    console.error(`[API get-user-status] Catch block error for ${email}:`, errorMessage, error);
    res.status(500).json({ error: `Server error: ${errorMessage}` });
  }
}