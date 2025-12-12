// FILE: src/components/AppLayout.tsx
// NEW: A layout component that contains the sidebar and main content.

import React from 'react';
import AppSidebar from '@/components/AppSidebar';
import { Outlet } from 'react-router-dom';

const AppLayout = () => {
  return (
    <div className="relative min-h-screen w-full bg-background text-foreground flex">
      <AppSidebar />
      <main className="flex-1 pl-0 md:pl-64 overflow-y-auto">
        <div className="max-w-3xl mx-auto p-4 md:p-8">
          <Outlet /> 
        </div>
      </main>
    </div>
  );
};

export default AppLayout;
