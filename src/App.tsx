// FILE: src/App.tsx
// FINAL CORRECTED VERSION: Intelligent layout for full-width landing page.

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
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

const ProtectedRoute = ({ children, requiredAccess = 'trial' }: { children: JSX.Element, requiredAccess?: 'trial' | 'paid' }) => {
  const { isAuthenticated, isLoading, accessLevel } = useAuth();
  if (isLoading) { return <div className="flex justify-center items-center min-h-screen">Verifying access...</div>; }
  if (!isAuthenticated) { return <Navigate to="/" replace />; }
  if (requiredAccess === 'paid') {
    const isPaidUser = accessLevel === 'standard_lifetime' || accessLevel === 'premium_lifetime';
    if (!isPaidUser) { return <Navigate to="/upgrade" replace />; }
  }
  return children;
};

// --- vvv THIS IS THE NEW INTELLIGENT LAYOUT WRAPPER vvv ---
const MainLayout = () => {
  const location = useLocation();
  const isLandingPage = location.pathname === '/';

  return (
    <div className="relative min-h-screen w-full bg-background text-foreground flex">
      {!isLandingPage && <AppSidebar />}
      <main className={`flex-1 overflow-y-auto ${!isLandingPage ? 'md:pl-64' : ''}`}>
        <div className={!isLandingPage ? 'max-w-3xl mx-auto p-4 md:p-8' : ''}>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            <Route path="/terms-conditions" element={<TermsConditions />} />
            <Route path="/faq" element={<FAQ />} />
            
            <Route path="/calibrate/:treatmentNumber" element={<ProtectedRoute><ActivationPage /></ProtectedRoute>} />
            <Route path="/treatment-1" element={<ProtectedRoute><Treatment1 /></ProtectedRoute>} />
            <Route path="/treatment-2" element={<ProtectedRoute requiredAccess='paid'><Treatment2 /></ProtectedRoute>} />
            <Route path="/treatment-3" element={<ProtectedRoute requiredAccess='paid'><Treatment3 /></ProtectedRoute>} />
            <Route path="/treatment-4" element={<ProtectedRoute requiredAccess='paid'><Treatment4 /></ProtectedRoute>} />
            <Route path="/treatment-5" element={<ProtectedRoute requiredAccess='paid'><Treatment5 /></ProtectedRoute>} />
            <Route path="/upgrade" element={<ProtectedRoute><PaymentPage /></ProtectedRoute>} />
            <Route path="/follow-up" element={<ProtectedRoute requiredAccess='paid'><FollowUp /></ProtectedRoute>} />
            
            <Route path="*" element={<NotFound />} />
          </Routes>
        </div>
      </main>
    </div>
  );
};
// --- ^^^ END OF NEW WRAPPER ^^^ ---

function App() {
  return (
    <SidebarProvider> 
      <Router>
        <Toaster />
        <MainLayout />
      </Router>
    </SidebarProvider>
  );
}
export default App;
