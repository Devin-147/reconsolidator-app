// src/main.tsx
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';                             // <<< REMOVED .tsx
import './index.css';
import { ThemeProvider } from './components/theme-provider'; // <<< REMOVED .tsx (Verify path if needed)
import { AuthProvider } from './contexts/AuthContext'; // <<< REMOVED .tsx (Verify path if needed)

// Find the root element - ensure 'root' exists in your index.html
const container = document.getElementById("root");

// Ensure the container element is not null before creating the root
if (!container) {
  throw new Error("Failed to find the root element with ID 'root'. Check your index.html.");
}

// Create the root
const root = createRoot(container);

// Render the application into the root
root.render(
  <React.StrictMode>
    {/* AuthProvider now wraps everything */}
    <AuthProvider>
      <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
        <App />
      </ThemeProvider>
    </AuthProvider>
  </React.StrictMode>
);