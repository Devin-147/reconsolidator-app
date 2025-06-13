// FILE: src/App.tsx

import React from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from 'react-router-dom';
import { Toaster } from './components/ui/sonner';
import { useAuth } from './contexts/AuthContext';
import { SidebarProvider } from './components/ui/sidebar';
import AppSidebar from './components/AppSidebar';

// Page Component Imports
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
import LogoTestLab from './pages/LogoTestLab'; // Import the new test page

// --- Protected Route Component ---
const ProtectedRoute = ({ children, requiredStatus = 'trial' }: { children: JSX.Element, requiredStatus?: 'trial' | 'paid' }) => {
  const { isAuthenticated, userStatus, isLoading } = useAuth();
  const location = useLocation();

  const BYPASS_PAYMENT_FOR_TESTING = true; 
  
  console.log(
    `ProtectedRoute Check: Path=${location.pathname}, isLoading=${isLoading}, userStatus=${userStatus}, derived isAuthenticated=${isAuthenticated}, PaymentBypassActive=${BYPASS_PAYMENT_FOR_TESTING}`
  );

  if (isLoading) {
    return <div className="flex justify-center items-center min-h-screen">Loading Access...</div>;
  }

  if (!isAuthenticated) {
    console.log("ProtectedRoute: Not authenticated, redirecting to /welcome");
    return <Navigate to="/welcome" replace />;
  }

  if (BYPASS_PAYMENT_FOR_TESTING && requiredStatus === 'paid') {
    console.warn(`ProtectedRoute: PAYMENT CHECK BYPASSED for route requiring 'paid' status (Path: ${location.pathname}). User status is '${userStatus}'. Accessing as if paid.`);
    return children; 
  }

  if (requiredStatus === 'paid' && userStatus !== 'paid') {
    console.log(`ProtectedRoute: Paid status required for ${location.pathname}, user has '${userStatus}'. Redirecting to /upgrade.`);
    return <Navigate to="/upgrade" replace />;
  }
  return children;
};
// --- End Protected Route Component ---

function App() {
  return (
    <SidebarProvider> 
      <Router>
        <div className="relative min-h-screen w-full bg-background text-foreground flex"> 
          <AppSidebar /> 
          <main className="flex-1 pl-0 md:pl-64 overflow-y-auto"> 
            <div className="max-w-3xl mx-auto p-4 md:p-8"> 
              <Routes>
                <Route path="/welcome" element={<LandingPage />} />
                <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                <Route path="/terms-conditions" element={<TermsConditions />} />
                <Route path="/faq" element={<FAQ />} />

                {/* Test Route for Logo Animation */}
                <Route path="/logo-test-lab" element={<LogoTestLab />} />

                <Route path="/calibrate/:treatmentNumber" element={ <ProtectedRoute requiredStatus='trial'><ActivationPage /></ProtectedRoute> } />
                <Route path="/" element={ <ProtectedRoute requiredStatus='trial'><Navigate to="/calibrate/1" replace /></ProtectedRoute> } />

                <Route path="/treatment-1" element={<ProtectedRoute requiredStatus='trial'><Treatment1 /></ProtectedRoute>} />
                <Route path="/treatment-2" element={<ProtectedRoute requiredStatus='paid'><Treatment2 /></ProtectedRoute>} />
                <Route path="/treatment-3" element={<ProtectedRoute requiredStatus='paid'><Treatment3 /></ProtectedRoute>} />
                <Route path="/treatment-4" element={<ProtectedRoute requiredStatus='paid'><Treatment4 /></ProtectedRoute>} />
                <Route path="/treatment-5" element={<ProtectedRoute requiredStatus='paid'><Treatment5 /></ProtectedRoute>} />
                
                <Route path="/upgrade" element={<ProtectedRoute requiredStatus='trial'><PaymentPage /></ProtectedRoute>} />
                <Route path="/follow-up" element={<ProtectedRoute requiredStatus='paid'><FollowUp /></ProtectedRoute>} />

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