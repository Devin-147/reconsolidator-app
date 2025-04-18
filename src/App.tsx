// src/App.tsx
import React from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation, // Keep for logging in ProtectedRoute
} from 'react-router-dom';
import { Toaster } from './components/ui/sonner'; // For toast notifications
import { ThemeProvider } from './components/theme-provider'; // For dark/light mode
import { RecordingProvider } from './contexts/RecordingContext'; // For treatment data
import { useAuth } from './contexts/AuthContext'; // For authentication state
import { SidebarProvider } from './components/ui/sidebar'; // For sidebar state, if used globally

// --- Page Component Imports ---
import LandingPage from './pages/LandingPage';       // Public marketing/signup page
import MemoryForm from './pages/Index';            // Memory/SUDS setup page (protected)
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

// --- Protected Route Component ---
// Guards routes based on authentication status and required access level (trial/paid)
const ProtectedRoute = ({ children, requiredStatus = 'trial' }: { children: JSX.Element, requiredStatus?: 'trial' | 'paid' }) => {
  const { isAuthenticated, userStatus, isLoading } = useAuth();
  const location = useLocation();

  // Log state during check for debugging
  console.log(
    `ProtectedRoute Check: Path=${location.pathname}, isLoading=${isLoading}, userStatus=${userStatus}, derived isAuthenticated=${isAuthenticated}`
  );

  // 1. Handle Loading State: Show indicator while auth status is being checked
  if (isLoading) {
    console.log(`ProtectedRoute: Rendering Loading state for path ${location.pathname}.`);
    return <div className="flex justify-center items-center min-h-screen">Loading Access...</div>;
  }

  // 2. Handle Not Authenticated: Redirect to public landing page if not logged in at all
  if (!isAuthenticated) {
    console.log(`ProtectedRoute: Not Authenticated (isLoading=${isLoading}, userStatus=${userStatus}) for path ${location.pathname}. Redirecting to /welcome`);
    return <Navigate to="/welcome" replace />; // Redirect to public landing page
  }

  // 3. Handle Insufficient Paid Status: Redirect to upgrade page if 'paid' is required but user isn't 'paid'
  if (requiredStatus === 'paid' && userStatus !== 'paid') {
    console.log(`ProtectedRoute: Paid status required, user has '${userStatus}'. Redirecting path ${location.pathname} to /upgrade`);
    return <Navigate to="/upgrade" replace />; // Send to payment page
  }

  // 4. Allow Access: If loading is done, user is authenticated, and meets status requirements
  console.log(`ProtectedRoute: Access GRANTED for path ${location.pathname}. Rendering children.`);
  return children; // Render the requested protected component
};
// --- End Protected Route Component ---


// --- Main Application Structure ---
function App() {
  return (
    // Ensure AuthProvider wraps ThemeProvider/App in main.tsx
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <RecordingProvider>
        <SidebarProvider> {/* If sidebar is used across multiple routes */}
          <Router>
            <Routes>
              {/* === Public Routes === */}
              {/* Public Landing / Marketing Page */}
              <Route path="/welcome" element={<LandingPage />} />
              {/* Static Content Pages */}
              <Route path="/privacy-policy" element={<PrivacyPolicy />} />
              <Route path="/terms-conditions" element={<TermsConditions />} />
              <Route path="/faq" element={<FAQ />} />

              {/* === Protected Routes === */}
              {/* Root '/' is the Memory Setup page, requires at least 'trial' */}
              <Route path="/" element={<ProtectedRoute requiredStatus='trial'><MemoryForm /></ProtectedRoute>} />

              {/* Treatment 1 requires 'trial' (prerequisites checked inside component) */}
              <Route path="/treatment-1" element={<ProtectedRoute requiredStatus='trial'><Treatment1 /></ProtectedRoute>} />

              {/* Upgrade page requires 'trial' (to encourage upgrade) */}
              <Route path="/upgrade" element={<ProtectedRoute requiredStatus='trial'><PaymentPage /></ProtectedRoute>} />

              {/* Treatments 2-5 require 'paid' status */}
              <Route path="/treatment-2" element={<ProtectedRoute requiredStatus='paid'><Treatment2 /></ProtectedRoute>} />
              <Route path="/treatment-3" element={<ProtectedRoute requiredStatus='paid'><Treatment3 /></ProtectedRoute>} />
              <Route path="/treatment-4" element={<ProtectedRoute requiredStatus='paid'><Treatment4 /></ProtectedRoute>} />
              <Route path="/treatment-5" element={<ProtectedRoute requiredStatus='paid'><Treatment5 /></ProtectedRoute>} />
              {/* Assuming FollowUp also requires 'paid' status */}
              <Route path="/follow-up" element={<ProtectedRoute requiredStatus='paid'><FollowUp /></ProtectedRoute>} />


              {/* === Catch-all / 404 Route === */}
              {/* Renders the NotFound component for any unmatched paths */}
              <Route path="*" element={<NotFound />} />
              {/* Removed the CatchAll helper as NotFound component is better */}

            </Routes>
            <Toaster /> {/* For displaying toast notifications */}
          </Router>
        </SidebarProvider>
      </RecordingProvider>
    </ThemeProvider>
  );
}

export default App;