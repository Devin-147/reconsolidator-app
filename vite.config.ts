import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, process.cwd(), '');

  // Log the mode and env variables for debugging
  console.log(`--- Vite config running in mode: ${mode} ---`);
  console.log("--- Logging loaded env vars (vite.config.ts) ---");
  console.log("Loaded VITE_SUPABASE_URL:", env.VITE_SUPABASE_URL);
  console.log("Loaded VITE_SUPABASE_ANON_KEY:", env.VITE_SUPABASE_ANON_KEY);
  console.log("--- End logging loaded env vars ---");

  // Check if the loaded values are undefined here
  if (!env.VITE_SUPABASE_URL || !env.VITE_SUPABASE_ANON_KEY) {
      console.error("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
      console.error("ERROR INSIDE vite.config.ts: VITE_SUPABASE variables are UNDEFINED after loadEnv!");
      console.error("Check .env.local file location, name, and content AGAIN.");
      console.error("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
  }

  return {
    plugins: [react()],
    // Define section - using the 'env' object we loaded
    define: {
      'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(env.VITE_SUPABASE_URL),
      'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(env.VITE_SUPABASE_ANON_KEY),
      'import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY': JSON.stringify(env.VITE_STRIPE_PUBLISHABLE_KEY),
      'import.meta.env.VITE_RECAPTCHA_SITE_KEY': JSON.stringify(env.VITE_RECAPTCHA_SITE_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
  };
});