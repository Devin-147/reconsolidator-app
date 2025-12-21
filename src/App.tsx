// FILE: src/App.tsx
// FINAL CORRECTED VERSION: Upgraded ProtectedRoute for nuanced access control.

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { Toaster } from './components/ui/sonner';
import { useAuth } from './contexts/AuthContext';
import { SidebarProvider } from './components/ui/sidebar';
import AppLayout from './components/AppLayout';
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

// --- vvv THIS IS THE UPGRADED PROTECTEDROUTE COMPONENT vvv ---
const ProtectedRoute = ({ children, requiredAccess = 'trial' }: { children: JSX.Element, requiredAccess?: 'trial' | 'paid' }) => {
  const { isAuthenticated, isLoading, accessLevel } = useAuth();

  if (isLoading) {
    return <div className="flex justify-center items-center min-h-screen">Verifying access...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  // Check for paid access if required for the route
  if (requiredAccess === 'paid') {
    const isPaidUser = accessLevel === 'standard_lifetime' || accessLevel === 'premium_lifetime';
    if (!isPaidUser) {
      // If a non-paying user tries to access a paid route, send them to the upgrade page.
      return <Navigate to="/upgrade" replace />;
    }
  }

  // If all checks pass, render the requested child component.
  return children;
};
// --- ^^^ END OF UPGRADE ^^^ ---


function App() {
  return (
    <SidebarProvider> 
      <Router>
        <Toaster />
        <Routes>
          <Route path="/" element={<LandingPage />} />
          
          {/* Public info pages */}
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/terms-conditions" element={<TermsConditions />} />
          <Route path="/faq" element={<FAQ />} />

          {/* Protected routes that require authentication */}
          <Route element={<AppLayout />}>
            <Route path="/calibrate/1" element={<ProtectedRoute requiredAccess='trial'><ActivationPage /></ProtectedRoute>} />
            <Route path="/treatment-1" element={<ProtectedRoute requiredAccess='trial'><Treatment1 /></ProtectedRoute>} />
            <Route path="/upgrade" element={<ProtectedRoute requiredAccess='trial'><PaymentPage /></ProtectedRoute>} />
            
            {/* These routes now correctly require 'paid' access */}
            <Route path="/calibrate/2" element={<ProtectedRoute requiredAccess='paid'><ActivationPage /></ProtectedRoute>} />
            <Route path="/calibrate/3" element={<ProtectedRoute requiredAccess='paid'><ActivationPage /></ProtectedRoute>} />
            <Route path="/calibrate/4" element={<ProtectedRoute requiredAccess='paid'><ActivationPage /></ProtectedRoute>} />
            <Route path="/calibrate/5" element={<ProtectedRoute requiredAccess='paid'><ActivationPage /></ProtectedRoute>} />
            
            <Route path="/treatment-2" element={<ProtectedRoute requiredAccess='paid'><Treatment2 /></ProtectedRoute>} />
            <Route path="/treatment-3" element={<ProtectedRoute requiredAccess='paid'><Treatment3 /></ProtectedRoute>} />
            <Route path="/treatment-4" element={<ProtectedRoute requiredAccess='paid'><Treatment4 /></ProtectedRoute>} />
            <Route path="/treatment-5" element={<ProtectedRoute requiredAccess='paid'><Treatment5 /></ProtectedRoute>} />
            <Route path="/follow-up" element={<ProtectedRoute requiredAccess='paid'><FollowUp /></ProtectedRoute>} />
          </Route>
          
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
    </SidebarProvider>
  );
}
export default App;
