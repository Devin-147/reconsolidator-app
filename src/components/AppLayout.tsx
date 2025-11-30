// FILE: src/components/AppLayout.tsx
// NEW: A layout to apply futuristic styles to inner pages.

import React, { useEffect } from 'react';
import { motion } from 'framer-motion';

// This component wraps our inner pages to give them the new style.
const AppLayout = ({ children }: { children: React.ReactNode }) => {
  useEffect(() => {
    // This adds the new font and styles only when this layout is used.
    const fontId = 'exo2-font-link';
    if (!document.getElementById(fontId)) {
      const fontLink = document.createElement('link');
      fontLink.id = fontId;
      fontLink.href = 'https://fonts.googleapis.com/css2?family=Exo+2:wght@400;600;700&display=swap';
      fontLink.rel = 'stylesheet';
      document.head.appendChild(fontLink);
    }
  }, []);

  return (
    <div 
      className="futuristic-theme min-h-screen w-full"
      style={{
        // The new smoky gradient background
        backgroundImage: 'radial-gradient(circle at top, hsl(222, 47%, 15%) 0%, hsl(222, 47%, 11%) 100%)',
        // The new futuristic font
        fontFamily: "'Exo 2', sans-serif",
      }}
    >
      {/* This adds a subtle fade-in animation to the page content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {children}
      </motion.div>
    </div>
  );
};

export default AppLayout;
