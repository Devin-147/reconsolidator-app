// FILE: api/complete-treatment.ts
import { createClient } from '@supabase/supabase-js';
import type { VercelRequest, VercelResponse } from '@vercel/node';

const supabaseAdmin = createClient(process.env.VITE_SUPABASE_URL || '', process.env.SUPABASE_SERVICE_KEY || '');

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  try {
    const { userEmail, treatmentNumber, finalSuds, initialSuds } = req.body;

    const updates: any = {
      current_suds: finalSuds,
      last_treatment_completed_at: new Date().toISOString(),
    };
    if (treatmentNumber === 1) {
      updates.initial_suds = initialSuds;
    }

    const { error } = await supabaseAdmin.from('users').update(updates).eq('email', userEmail);
    if (error) throw error;

    res.status(200).json({ message: 'Treatment progress saved.' });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
}
