// src/App.tsx
import React from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from 'react-router-dom';
import { Toaster } from './components/ui/sonner';
import { ThemeProvider } from './components/theme-provider';
import { RecordingProvider } from './contexts/RecordingContext';
import { useAuth } from './contexts/AuthContext';
import { SidebarProvider } from './components/ui/sidebar';

// --- Page Component Imports ---
import LandingPage from './pages/LandingPage';       // Public marketing/signup page @ /welcome
import ActivationPage from './pages/ActivationPage'; // <<< CHANGED IMPORT (Memory Setup page @ /)
import Treatment1 from './pages/Treatment1';         // Treatment 1 processing steps (protected)
import PaymentPage from './pages/PaymentPage';       // Upgrade/Payment page (protected)
import Treatment2 from './pages/Treatment2';         // Paid content
import Treatment3 from './pages/Treatment3';         // Paid content
import Treatment4 from './pages/Treatment4';         // Paid content
import Treatment5 from './pages/Treatment5';         // Paid content
import FollowUp from './pages/FollowUp';           // Paid content? (Assuming)
import PrivacyPolicy from './pages/PrivacyPolicy';   // Public static page
import TermsConditions from './pages/TermsConditions'; // Public static page
import FAQ from './pages/FAQ';                   // Public static page
import NotFound from './pages/NotFound';           // 404 page

// --- Protected Route Component (Remains the same as Response #96) ---
const ProtectedRoute = ({ children, requiredStatus = 'trial' }: { children: JSX.Element, requiredStatus?: 'trial' | 'paid' }) => {
  const { isAuthenticated, userStatus, isLoading } = useAuth();
  const location = useLocation();
  console.log( `ProtectedRoute Check: Path=${location.pathname}, isLoading=${isLoading}, userStatus=${userStatus}, derived isAuthenticated=${isAuthenticated}` );
  if (isLoading) { console.log(`ProtectedRoute: Loading state for ${location.pathname}.`); return <div className="flex justify-center items-center min-h-screen">Loading Access...</div>; }
  if (!isAuthenticated) { console.log(`ProtectedRoute: Not Authenticated for ${location.pathname}. Redirecting to /welcome`); return <Navigate to="/welcome" replace />; }
  if (requiredStatus === 'paid' && userStatus !== 'paid') { console.log(`ProtectedRoute: Paid required, user has '${userStatus}'. Redirecting ${location.pathname} to /upgrade`); return <Navigate to="/upgrade" replace />; }
  console.log(`ProtectedRoute: Access GRANTED for ${location.pathname}.`); return children;
};
// --- End Protected Route Component ---


// --- Main Application Structure ---
function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <RecordingProvider>
        <SidebarProvider>
          <Router>
            <Routes>
              {/* === Public Routes === */}
              <Route path="/welcome" element={<LandingPage />} />
              <Route path="/privacy-policy" element={<PrivacyPolicy />} />
              <Route path="/terms-conditions" element={<TermsConditions />} />
              <Route path="/faq" element={<FAQ />} />

              {/* === Protected Routes === */}
              {/* Root '/' is the Activation/Setup page */}
              <Route path="/" element={<ProtectedRoute requiredStatus='trial'><ActivationPage /></ProtectedRoute>} /> {/* <<< CHANGED COMPONENT */}

              {/* Treatment 1 Processing Phases */}
              <Route path="/treatment-1" element={<ProtectedRoute requiredStatus='trial'><Treatment1 /></ProtectedRoute>} />

              {/* Upgrade/Payment Page */}
              <Route path="/upgrade" element={<ProtectedRoute requiredStatus='trial'><PaymentPage /></ProtectedRoute>} />

              {/* Paid Content */}
              <Route path="/treatment-2" element={<ProtectedRoute requiredStatus='paid'><Treatment2 /></ProtectedRoute>} />
              <Route path="/treatment-3" element={<ProtectedRoute requiredStatus='paid'><Treatment3 /></ProtectedRoute>} />
              <Route path="/treatment-4" element={<ProtectedRoute requiredStatus='paid'><Treatment4 /></ProtectedRoute>} />
              <Route path="/treatment-5" element={<ProtectedRoute requiredStatus='paid'><Treatment5 /></ProtectedRoute>} />
              <Route path="/follow-up" element={<ProtectedRoute requiredStatus='paid'><FollowUp /></ProtectedRoute>} />

              {/* === Catch-all / 404 Route === */}
              <Route path="*" element={<NotFound />} />

            </Routes>
            <Toaster />
          </Router>
        </SidebarProvider>
      </RecordingProvider>
    </ThemeProvider>
  );
}

// Removed CatchAll helper as NotFound is used directly

export default App;