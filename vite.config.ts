// FILE: vite.config.ts

import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path'; 

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  console.log(`--- Vite config running in mode: ${mode} ---`);
  if (!env.VITE_SUPABASE_URL || !env.VITE_SUPABASE_ANON_KEY) {
      console.error("ERROR INSIDE vite.config.ts: VITE_SUPABASE variables are UNDEFINED!");
  }
  return {
    plugins: [ react() ],
    server: { 
      proxy: {
        '/api': { target: `http://localhost:3000`, changeOrigin: true, }
      }
    },
    define: {
      'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(env.VITE_SUPABASE_URL),
      'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(env.VITE_SUPABASE_ANON_KEY),
      'import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY': JSON.stringify(env.VITE_STRIPE_PUBLISHABLE_KEY),
    },
    resolve: {
      alias: { '@': path.resolve(__dirname, './src'), },
    },
  };
});