// FILE: vite.config.ts (Simplified and Cleaned)

import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path'; // Ensure 'path' is imported for aliases

// Ensure 'vite-plugin-svgr' and 'vite-plugin-vercel' are NOT imported
// if we are not using their plugins explicitly in the plugins array.

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  // Log the mode and env variables for debugging
  console.log(`--- Vite config running in mode: ${mode} ---`);
  console.log("--- Logging loaded env vars (vite.config.ts) ---");
  console.log("Loaded VITE_SUPABASE_URL:", env.VITE_SUPABASE_URL);
  console.log("Loaded VITE_SUPABASE_ANON_KEY:", env.VITE_SUPABASE_ANON_KEY);
  console.log("--- End logging loaded env vars ---");

  if (!env.VITE_SUPABASE_URL || !env.VITE_SUPABASE_ANON_KEY) {
      console.error("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
      console.error("ERROR INSIDE vite.config.ts: VITE_SUPABASE variables are UNDEFINED after loadEnv!");
      console.error("Check .env.local file location, name, and content AGAIN.");
      console.error("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
  }

  return { // This is the start of the returned object
    plugins: [
      react(),
      // vercel() plugin removed for now
      // svgr() plugin removed
    ],
    // server: { // server.proxy removed for now; vercel dev should handle API routing.
    //   proxy: {
    //     '/api': {
    //       target: `http://localhost:3000`, // Or your vercel dev port
    //       changeOrigin: true,
    //     }
    //   }
    // },
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
  }; // This is the end of the returned object
});