// FILE: src/App.tsx
// FINAL CORRECTED VERSION: Fixes the landing page layout issue.

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { Toaster } from './components/ui/sonner';
import { useAuth } from './contexts/AuthContext';
import { SidebarProvider } from './components/ui/sidebar';
import AppSidebar from './components/AppSidebar';
import LandingPage from './pages/LandingPage';
import ActivationPage from './pages/ActivationPage';
import Treatment1 from './pages/Treatment1';
import Treatment2 from './pages/Treatment2';
import Treatment3 from './pages/Treatment3';
import Treatment4 from './pages/Treatment4';
import Treatment5 from './pages/Treatment5';
import FollowUp from './pages/FollowUp';
import PaymentPage from './pages/PaymentPage';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsConditions from './pages/TermsConditions';
import FAQ from './pages/FAQ';
import NotFound from './pages/NotFound';

// This is the layout for all INNER pages of the app. It includes the sidebar.
const AppLayout = () => (
  <div className="relative min-h-screen w-full bg-background text-foreground flex">
    <AppSidebar />
    <main className="flex-1 pl-0 md:pl-64 overflow-y-auto">
      <div className="max-w-3xl mx-auto p-4 md:p-8">
        <Outlet /> {/* Nested routes will render here */}
      </div>
    </main>
  </div>
);

// This is the gatekeeper for protected pages.
const ProtectedRoutes = ({ requiredAccess = 'trial' }: { requiredAccess?: 'trial' | 'paid' }) => {
  const { isAuthenticated, isLoading, accessLevel } = useAuth();

  if (isLoading) {
    return <div className="flex justify-center items-center min-h-screen">Verifying access...</div>;
  }
  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }
  if (requiredAccess === 'paid') {
    const isPaidUser = accessLevel === 'standard_lifetime' || accessLevel === 'premium_lifetime';
    if (!isPaidUser) {
      return <Navigate to="/upgrade" replace />;
    }
  }
  return <Outlet />; // If checks pass, render the nested child route
};

function App() {
  return (
    <SidebarProvider> 
      <Router>
        <Toaster />
        <Routes>
          {/* Public routes render without the AppLayout */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/terms-conditions" element={<TermsConditions />} />
          <Route path="/faq" element={<FAQ />} />

          {/* Protected routes are nested inside the AppLayout */}
          <Route element={<AppLayout />}>
            <Route element={<ProtectedRoutes requiredAccess='trial' />}>
              <Route path="/calibrate/1" element={<ActivationPage />} />
              <Route path="/treatment-1" element={<Treatment1 />} />
              <Route path="/upgrade" element={<PaymentPage />} />
            </Route>
            <Route element={<ProtectedRoutes requiredAccess='paid' />}>
              <Route path="/calibrate/:treatmentNumber" element={<ActivationPage />} />
              <Route path="/treatment-2" element={<Treatment2 />} />
              <Route path="/treatment-3" element={<Treatment3 />} />
              <Route path="/treatment-4" element={<Treatment4 />} />
              <Route path="/treatment-5" element={<Treatment5 />} />
              <Route path="/follow-up" element={<FollowUp />} />
            </Route>
          </Route>
          
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
    </SidebarProvider>
  );
}
export default App;
