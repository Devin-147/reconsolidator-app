// src/App.tsx
import React from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation, // Import useLocation to log path
} from 'react-router-dom';
import { Toaster } from './components/ui/sonner';
import { ThemeProvider } from './components/theme-provider';
import { RecordingProvider } from './contexts/RecordingContext';
import { useAuth } from './contexts/AuthContext'; // <<<--- Only IMPORT useAuth (AuthProvider is used in main.tsx)
import { SidebarProvider } from './components/ui/sidebar';

// --- Import ALL your Page Components ---
import LandingPage from './pages/LandingPage';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsConditions from './pages/TermsConditions';
import FAQ from './pages/FAQ';
// import VerifyAccessPage from './pages/VerifyAccessPage'; // Only if using token verification
// import MainAppEntry from './pages/Index'; // Not used in routes below?
import Treatment1 from './pages/Treatment1';
import Treatment2 from './pages/Treatment2';
import Treatment3 from './pages/Treatment3';
import Treatment4 from './pages/Treatment4';
import Treatment5 from './pages/Treatment5';
import FollowUp from './pages/FollowUp';
import PaymentPage from './pages/PaymentPage';
import NotFound from './pages/NotFound'; // Assuming you have this

// --- Protected Route Component (Refined Logic) ---
const ProtectedRoute = ({ children, requiredStatus = 'trial' }: { children: JSX.Element, requiredStatus?: 'trial' | 'paid' }) => {
  const { isAuthenticated, userStatus, isLoading } = useAuth();
  const location = useLocation(); // Get current location for logging

  // Log the state received by THIS specific render of ProtectedRoute
  console.log(
    `ProtectedRoute Check: Path=${location.pathname}, isLoading=${isLoading}, userStatus=${userStatus}, derived isAuthenticated=${isAuthenticated}`
  );

  // --- Explicitly handle loading state FIRST ---
  // If the status is still being checked, show a loading indicator.
  // This prevents premature redirects while the initial check after signup/login resolves.
  if (isLoading) {
    console.log(`ProtectedRoute: Rendering Loading state because isLoading is true for path ${location.pathname}.`);
    // Consider a more visually appealing loading component
    return <div className="flex justify-center items-center min-h-screen">Loading Access...</div>;
  }

  // --- Now check authentication AFTER confirming isLoading is false ---
  // If not authenticated (which implies userStatus is 'none' since isLoading is false), redirect to landing.
  if (!isAuthenticated) {
    console.log(`ProtectedRoute: Condition !isAuthenticated is TRUE (isLoading=${isLoading}, userStatus=${userStatus}) for path ${location.pathname}. Redirecting to /`);
    return <Navigate to="/" replace />; // Use replace to avoid adding landing page to history unnecessarily
  }

  // --- Check for required paid status (only if the route needs 'paid') ---
  if (requiredStatus === 'paid' && userStatus !== 'paid') {
    console.log(`ProtectedRoute: Condition for PAID required is TRUE (required=${requiredStatus}, status=${userStatus}) for path ${location.pathname}. Redirecting to /upgrade`); // Redirect to upgrade/payment page might be better
    // Consider redirecting to an upgrade page instead of /start if /start is not defined
    return <Navigate to="/upgrade" replace />; // Redirect to upgrade page
  }

  // --- Allow access ---
  // If none of the above conditions caused a redirect, the user is authorized for this route.
  console.log(`ProtectedRoute: All checks passed for path ${location.pathname}. Rendering children.`);
  return children; // Render the actual protected component (e.g., <Treatment1 />)
};
// --- End Protected Route Component ---


function App() {
  return (
    // ThemeProvider wraps everything (AuthProvider should wrap this in main.tsx)
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
       {/* RecordingProvider provides state for recordings */}
      <RecordingProvider>
        {/* SidebarProvider if needed */}
        <SidebarProvider>
          {/* Router handles navigation */}
          <Router>
            <Routes>
              {/* --- Publicly Accessible Routes --- */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/privacy-policy" element={<PrivacyPolicy />} />
              <Route path="/terms-conditions" element={<TermsConditions />} />
              <Route path="/faq" element={<FAQ />} />
              {/* <Route path="/verify-access" element={<VerifyAccessPage />} /> */}

              {/* --- Core Application Routes (Protected) --- */}
              {/* Treatment 1 requires at least 'trial' status */}
              <Route path="/treatment-1" element={<ProtectedRoute requiredStatus='trial'><Treatment1 /></ProtectedRoute>} />

              {/* --- Payment Page Route --- */}
              {/* Requires 'trial' access to reach the upgrade page */}
              <Route path="/upgrade" element={<ProtectedRoute requiredStatus='trial'><PaymentPage /></ProtectedRoute>} />

              {/* --- Paid Content Routes --- */}
              {/* These routes require 'paid' status */}
              <Route path="/treatment-2" element={<ProtectedRoute requiredStatus='paid'><Treatment2 /></ProtectedRoute>} />
              <Route path="/treatment-3" element={<ProtectedRoute requiredStatus='paid'><Treatment3 /></ProtectedRoute>} />
              <Route path="/treatment-4" element={<ProtectedRoute requiredStatus='paid'><Treatment4 /></ProtectedRoute>} />
              <Route path="/treatment-5" element={<ProtectedRoute requiredStatus='paid'><Treatment5 /></ProtectedRoute>} />
              <Route path="/follow-up" element={<ProtectedRoute requiredStatus='paid'><FollowUp /></ProtectedRoute>} />

              {/* --- Catch-all / Not Found --- */}
              {/* Use your NotFound component for a better user experience */}
              <Route path="*" element={<NotFound />} />
              {/* Fallback redirect if NotFound doesn't exist */}
              {/* <Route path="*" element={<Navigate to="/" replace />} /> */}

            </Routes>
            <Toaster /> {/* Renders toast notifications */}
          </Router>
        </SidebarProvider>
      </RecordingProvider>
    </ThemeProvider>
  );
}

export default App;