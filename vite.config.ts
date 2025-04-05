// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from "path" // Node.js path module

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // Sets up the @/* path alias to point to the src directory
      "@": path.resolve(__dirname, "./src"),
    },
  },
  // Ensure API routes are proxied correctly during development (if needed)
  // server: {
  //   proxy: {
  //     '/api': 'http://localhost:3000' // Or your backend target if running separately
  //   }
  // }
})