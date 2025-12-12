// FILE: src/App.tsx
// FINAL CORRECTED VERSION

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

const ProtectedRoutes = () => {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return <div>Verifying access...</div>;
  if (!isAuthenticated) return <Navigate to="/" replace />;
  return <AppLayout />;
};

function App() {
  return (
    <SidebarProvider> 
      <Router>
        <Toaster />
        <Routes>
          <Route path="/" element={<LandingPage />} />
          
          <Route element={<ProtectedRoutes />}>
            <Route path="/calibrate/:treatmentNumber" element={<ActivationPage />} />
            <Route path="/treatment-1" element={<Treatment1 />} />
            <Route path="/treatment-2" element={<Treatment2 />} />
            <Route path="/treatment-3" element={<Treatment3 />} />
            <Route path="/treatment-4" element={<Treatment4 />} />
            <Route path="/treatment-5" element={<Treatment5 />} />
            <Route path="/upgrade" element={<PaymentPage />} />
            <Route path="/follow-up" element={<FollowUp />} />
          </Route>

          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/terms-conditions" element={<TermsConditions />} />
          <Route path="/faq" element={<FAQ />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
    </SidebarProvider>
  );
}
export default App;
