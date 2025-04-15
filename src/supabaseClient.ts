// src/supabaseClient.ts  <-- Path is correct based on your structure
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// --- IMPORTANT: Environment Variable Handling ---
// Vite uses import.meta.env and requires VITE_ prefix for client-side exposure

// --- THIS IS THE CORRECT WAY FOR VITE ---
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
// --- END CORRECT WAY ---


// --- Check if variables are set ---
// Add console logs BEFORE the check for temporary debugging if needed
// console.log("RUNTIME VITE_SUPABASE_URL:", supabaseUrl);
// console.log("RUNTIME VITE_SUPABASE_ANON_KEY:", typeof supabaseAnonKey);

if (!supabaseUrl) {
  // Update error message to only mention VITE_
  throw new Error("Supabase URL is not defined in environment. Check VITE_SUPABASE_URL variable in Vercel.");
}
if (!supabaseAnonKey) {
  // Update error message to only mention VITE_
  throw new Error("Supabase Anon Key is not defined in environment. Check VITE_SUPABASE_ANON_KEY variable in Vercel.");
}

// --- Create and Export the Client ---
export const supabase: SupabaseClient = createClient(supabaseUrl as string, supabaseAnonKey as string);

console.log("Supabase client initialization attempted.");