// FILE: src/App.tsx
// FINAL CORRECTED VERSION

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { Toaster } from './components/ui/sonner';
import { useAuth } from './contexts/AuthContext';
import { SidebarProvider } from './components/ui/sidebar';
import AppLayout from './components/AppLayout'; // Import the new layout
import LandingPage from './pages/LandingPage';
import ActivationPage from './pages/ActivationPage';
// ... (import all other pages)

const ProtectedRoutes = () => {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return <div>Verifying access...</div>;
  if (!isAuthenticated) return <Navigate to="/" replace />;
  return <AppLayout />; // Render the layout which contains the Outlet for nested routes
};

function App() {
  return (
    <SidebarProvider> 
      <Router>
        <Toaster />
        <Routes>
          <Route path="/" element={<LandingPage />} />
          
          {/* All protected routes are now nested inside the ProtectedRoutes element */}
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
