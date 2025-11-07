// FILE: tailwind.config.js
// MODIFIED: Added keyframes and animations for the NeuralSpinner component.

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
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
      
      // --- vvv THIS IS THE NEW BLOCK FOR THE NEURAL SPINNER vvv ---
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
        // You can keep your existing keyframes here if you have them,
        // like "accordion-down" and "accordion-up".
      },
      animation: {
        "pulse-slow": 'pulse-slow 2.5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        "pulse-delay": 'pulse-slow 2.5s cubic-bezier(0.4, 0, 0.6, 1) -1.25s infinite',
        // You can keep your existing animations here too.
      },
      // --- ^^^ END OF NEW BLOCK ^^^ ---

    },
  },
  plugins: [
    require("tailwindcss-animate")
  ],
}
