// FILE: tailwind.config.js
// MODIFIED: Added fontFamily to use "Exo 2" as the default sans-serif font.
/** @type {import('tailwindcss').Config} */
import { fontFamily } from "tailwindcss/defaultTheme"; // <<< We need this import

export default {
  darkMode: "class",
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // --- vvv THIS IS THE NEW FONTFAMILY BLOCK vvv ---
      fontFamily: {
        sans: ["Exo 2", ...fontFamily.sans],
      },
      // --- ^^^ END OF FONTFAMILY BLOCK ^^^ ---

      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      
      keyframes: {
        "pulse-slow": {
          '0%, 100%': { 
            transform: 'scale(0.1)',
            opacity: '0.2',
          },
          '50%': { 
            transform: 'scale(1)',
            opacity: '0.75',
