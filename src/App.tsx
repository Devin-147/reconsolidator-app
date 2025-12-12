// FILE: src/App.tsx
// FINAL CORRECTED VERSION

import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from './components/ui/sonner';
import { useAuth } from './contexts/AuthContext';
import { supabase } from './lib/supabaseClient'; // Import supabase client
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

const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const { isAuthenticated, isLoading, checkAuthStatus } = useAuth();
  const location = useLocation();

  useEffect(() => {
    // This effect handles the auth state after a magic link redirect
    const handleAuth = async () => {
      // Supabase puts the token in the URL hash
      const { data, error } = await supabase.auth.getSession();
      if (error) {
        console.error("Error getting session:", error);
      } else if (!data.session) {
        // If there's no session and the URL contains a token, it might be a new login
        // We can re-trigger a check in the AuthContext to be sure
        if (location.hash.includes('access_token')) {
          checkAuthStatus?.();
        }
      }
    };
    handleAuth();
  }, [location, checkAuthStatus]);

  if (isLoading) {
    return <div className="flex justify-center items-center min-h-screen">Verifying access...</div>;
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return children;
};

function App() {
  return (
    <SidebarProvider> 
      <Router>
        <div className="relative min-h-screen w-full bg-background text-foreground flex"> 
          <AppSidebar />
          <main className="flex-1 pl-0 md:pl-64 overflow-y-auto"> 
            <div className="max-w-3xl mx-auto p-4 md:p-8"> 
              <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                <Route path="/terms-conditions" element={<TermsConditions />} />
                <Route path="/faq" element={<FAQ />} />
                
                <Route 
                  path="/calibrate/:treatmentNumber" 
                  element={
                    <ProtectedRoute>
                      <ActivationPage />
                    </ProtectedRoute>
                  } 
                />
                
                <Route path="/treatment-1" element={<ProtectedRoute><Treatment1 /></ProtectedRoute>} />
                <Route path="/treatment-2" element={<ProtectedRoute><Treatment2 /></ProtectedRoute>} />
                <Route path="/treatment-3" element={<ProtectedRoute><Treatment3 /></ProtectedRoute>} />
                <Route path="/treatment-4" element={<ProtectedRoute><Treatment4 /></ProtectedRoute>} />
                <Route path="/treatment-5" element={<ProtectedRoute><Treatment5 /></ProtectedRoute>} />
                <Route path="/upgrade" element={<ProtectedRoute><PaymentPage /></ProtectedRoute>} />
                <Route path="/follow-up" element={<ProtectedRoute><FollowUp /></ProtectedRoute>} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </div> 
          </main>
        </div>
        <Toaster />
      </Router>
    </SidebarProvider>
  );
}
export default App;
