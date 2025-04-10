// src/main.tsx
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { ThemeProvider } from './components/theme-provider.tsx'; // Verify path if needed
import { AuthProvider } from './contexts/AuthContext'; // <<<--- ADDED IMPORT (Verify path)

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    {/* AuthProvider now wraps everything */}
    <AuthProvider>
      <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
        <App />
      </ThemeProvider>
    </AuthProvider>
  </React.StrictMode>
);