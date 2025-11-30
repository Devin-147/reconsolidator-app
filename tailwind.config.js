// FILE: tailwind.config.js
// CORRECTED: Includes "Exo 2" font and NeuralSpinner animations.

/** @type {import('tailwindcss').Config} */
import { fontFamily } from "tailwindcss/defaultTheme";

export default {
  darkMode: "class",
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Exo 2", ...fontFamily.sans],
      },
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
          },
        },
      },
      animation: {
        "pulse-slow": 'pulse-slow 2.5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        "pulse-delay": 'pulse-slow 2.5s cubic-bezier(0.4, 0, 0.6, 1) -1.25s infinite',
      },
    },
  },
  plugins: [
    require("tailwindcss-animate")
  ],
}
