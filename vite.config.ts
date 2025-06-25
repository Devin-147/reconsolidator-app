// FILE: vite.config.ts
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path'; // Ensure this is imported

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  // console.log("Vite config: Loaded VITE_SUPABASE_URL:", env.VITE_SUPABASE_URL); // Keep logs minimal

  return {
    plugins: [ react() ],
    define: {
      'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(env.VITE_SUPABASE_URL),
      'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(env.VITE_SUPABASE_ANON_KEY),
      'import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY': JSON.stringify(env.VITE_STRIPE_PUBLISHABLE_KEY),
      'import.meta.env.VITE_RECAPTCHA_SITE_KEY': JSON.stringify(env.VITE_RECAPTCHA_SITE_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'), // <<< ENSURE THIS IS PRESENT AND CORRECT
      },
    },
    // server: { // Keep this commented out if `vercel dev` handles API routing
    //   proxy: { '/api': { target: `http://localhost:3000`, changeOrigin: true } }
    // }
  };
});