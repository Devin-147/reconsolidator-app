// FILE: api/initiate-session.ts
// CORRECTED: Uses the correct 'filter' property for the listUsers method.

import type { VercelRequest, VercelResponse } from '@vercel/node';
import formidable from 'formidable';
import { createClient } from '@supabase/supabase-js';
// ... (other imports are the same)

const supabaseAdmin = createClient(process.env.VITE_SUPABASE_URL || '', process.env.SUPABASE_SERVICE_KEY || '');
// ... (other initializations are the same)

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // ... (initial checks are the same)
  
  try {
    const [fields, files] = await form.parse(req);
    const email = fields.email?.[0]?.trim().toLowerCase();
    if (!email) { return res.status(400).json({ error: 'Email is required.' }); }
    
    let aiDescription: string | null = null;
    /* ... (AI analysis logic is unchanged) ... */

    // --- vvv THIS IS THE CORRECTED LOGIC vvv ---
    // Check if user exists using a filter
    const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers({ filter: `email = '${email}'` });
    if (listError) throw listError;
    const authUser = users[0];
    // --- ^^^ END OF CORRECTION ^^^ ---

    if (authUser) {
      // User exists logic is unchanged
      await supabaseAdmin.auth.signInWithOtp({ email });
      // ...
    } else {
      // New user logic is unchanged
      // ...
    }

    res.status(200).json({ message: 'Please check your email for a sign-in link.' });

  } catch (error) {
    console.error('Error in initiate-session:', error);
    res.status(500).json({ error: 'Server error while processing your request.' });
  }
}
