// src/main.tsx
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';                             // Import App (correct)
import './aaaaa.css'                                // Import global styles (correct)
import { ThemeProvider } from './components/theme-provider'; // Import ThemeProvider (correct)
import { AuthProvider } from './contexts/AuthContext';       // Import AuthProvider (correct)
import { RecordingProvider } from './contexts/RecordingContext'; // <<< IMPORT RecordingProvider

const container = document.getElementById("root");
if (!container) { throw new Error("Root element with ID 'root' not found."); }
const root = createRoot(container);

// Render the application with CORRECT Provider nesting
root.render(
  <React.StrictMode>
    <AuthProvider>       {/* AuthProvider wraps RecordingProvider */}
      <RecordingProvider>  {/* RecordingProvider wraps ThemeProvider */}
        <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme"> {/* ThemeProvider wraps App */}
          <App />        {/* App is INSIDE all providers */}
        </ThemeProvider>
      </RecordingProvider>
    </AuthProvider>
  </React.StrictMode>
);
