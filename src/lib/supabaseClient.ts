// FILE: src/lib/supabaseClient.ts
// FINAL CORRECTED VERSION

import { createClient } from '@supabase/supabase-js';

// vvv THIS IS THE FIX vvv
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "";
// ^^^ END OF FIX ^^^

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Supabase URL or Anon Key is missing. Please check your .env and Vercel environment variables.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
