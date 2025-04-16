import { createClient, SupabaseClient } from '@supabase/supabase-js';

// --- Log the whole env object FIRST ---
console.log("DEBUG: Full import.meta.env object:", import.meta.env);

// --- Get values from env ---
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// --- Log the specific values obtained ---
console.log("DEBUG: Value obtained for VITE_SUPABASE_URL:", supabaseUrl);
console.log("DEBUG: Value obtained for VITE_SUPABASE_ANON_KEY:", supabaseAnonKey);
console.log("DEBUG: Type of supabaseUrl:", typeof supabaseUrl);
console.log("DEBUG: Type of supabaseAnonKey:", typeof supabaseAnonKey);


// --- Check if variables seem valid ---
if (!supabaseUrl || typeof supabaseUrl !== 'string') {
  console.error("ERROR: supabaseUrl is MISSING, not a string, or empty!");
  throw new Error("Supabase URL is not correctly defined in environment. Check VITE_SUPABASE_URL variable.");
}
if (!supabaseAnonKey || typeof supabaseAnonKey !== 'string') {
  console.error("ERROR: supabaseAnonKey is MISSING, not a string, or empty!");
  throw new Error("Supabase Anon Key is not correctly defined in environment. Check VITE_SUPABASE_ANON_KEY variable.");
}

// --- Create and Export the Client ---
// Initialize ONLY ONCE
export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey);

console.log("Supabase client initialization attempted.");
