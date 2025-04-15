// src/lib/supabaseClient.ts
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// --- IMPORTANT: Environment Variable Handling ---
// Use environment variables for your Supabase URL and Anon Key.

// Adjust based on your framework (e.g., NEXT_PUBLIC_ for Next.js, VITE_ for Vite)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL; // OR import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY; // OR import.meta.env.VITE_SUPABASE_ANON_KEY

// --- Check if variables are set ---
if (!supabaseUrl) {
  throw new Error("Supabase URL is not defined. Check your NEXT_PUBLIC_SUPABASE_URL (or VITE_SUPABASE_URL) environment variable.");
}
if (!supabaseAnonKey) {
  throw new Error("Supabase Anon Key is not defined. Check your NEXT_PUBLIC_SUPABASE_ANON_KEY (or VITE_SUPABASE_ANON_KEY) environment variable.");
}

// --- Create and Export the Client ---
// We assert the types using 'as string' because we've checked they exist above.
export const supabase: SupabaseClient = createClient(supabaseUrl as string, supabaseAnonKey as string);

console.log("Supabase client initialized successfully."); // Optional: for debugging