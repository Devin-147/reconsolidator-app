// FILE: src/main.tsx
// FINAL CORRECTED VERSION with inlined CSS

import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
// import './globals.css'; // This line is now removed.
import { ThemeProvider } from './components/theme-provider';
import { AuthProvider } from './contexts/AuthContext';
import { RecordingProvider } from './contexts/RecordingContext';

// --- vvv THIS IS THE NEW INLINED CSS BLOCK vvv ---
const css = `
  @tailwind base;
  @tailwind components;
  @tailwind utilities;

  @layer base {
    :root {
      --background: 222.2 84% 4.9%;
      --foreground: 210 40% 98%;
      --card: 222.2 84% 4.9%;
      --card-foreground: 210 40% 98%;
      --popover: 222.2 84% 4.9%;
      --popover-foreground: 210 40% 98%;
      --primary: 186 98% 59%;
      --primary-foreground: 222 47% 11%;
      --secondary: 217.2 32.6% 17.5%;
      --secondary-foreground: 210 40% 98%;
      --muted: 217.2 32.6% 17.5%;
      --muted-foreground: 215 20.2% 65.1%;
      --accent: 217.2 32.6% 17.5%;
      --accent-foreground: 210 40% 98%;
      --destructive: 0 62.8% 30.6%;
      --destructive-foreground: 210 40% 98%;
      --border: 217.2 32.6% 17.5%;
      --input: 217.2 32.6% 17.5%;
      --ring: 224.3 76.3% 48%;
    }

    .light {
      --background: 0 0% 100%;
      --foreground: 222.2 84% 4.9%;
      /* ... other light mode variables ... */
    }
  }

  @layer base {
    * {
      @apply border-border;
    }
    body {
      @apply bg-background text-foreground;
      background-image: radial-gradient(circle at top, hsl(222, 47%, 15%) 0%, hsl(222, 47%, 11%) 100%);
      min-height: 100vh;
    }
  }
`;
const styleEl = document.createElement('style');
styleEl.textContent = css;
document.head.appendChild(styleEl);
// --- ^^^ END OF NEW BLOCK ^^^ ---


const container = document.getElementById("root");
if (!container) { throw new Error("Root element with ID 'root' not found."); }
const root = createRoot(container);

root.render(
  <React.StrictMode>
    <AuthProvider>
      <RecordingProvider>
        <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
          <App />
        </ThemeProvider>
      </RecordingProvider>
    </AuthProvider>
  </React.StrictMode>
);
