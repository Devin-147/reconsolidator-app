// src/main.tsx
import React from 'react'; // Added import
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { ThemeProvider } from './components/theme-provider.tsx'; // Added import (adjust path if needed)

createRoot(document.getElementById("root")!).render(
  // Wrapped App with StrictMode and ThemeProvider
  <React.StrictMode>
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <App />
    </ThemeProvider>
  </React.StrictMode>
);