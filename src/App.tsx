// src/App.tsx
import React from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';
import { Toaster } from './components/ui/sonner';
import { ThemeProvider } from './components/theme-provider';
import { RecordingProvider, useRecording } from './contexts/RecordingContext';
import { AuthProvider, useAuth } from './contexts/AuthContext'; // <<<--- IMPORT AuthProvider and useAuth
import { SidebarProvider } from './components/ui/sidebar';

// --- Import ALL your Page Components ---
import LandingPage from './pages/LandingPage';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsConditions from './pages/TermsConditions';
import FAQ from './pages/FAQ';
// import VerifyAccessPage from './pages/VerifyAccessPage'; // Only if using token verification
import MainAppEntry from './pages/Index';
import Treatment1 from './pages/Treatment1';
import Treatment2 from './pages/Treatment2';
import Treatment3 from './pages/Treatment3';
import Treatment4 from './pages/Treatment4';
import Treatment5 from './pages/Treatment5';
import FollowUp from './pages/FollowUp';
import PaymentPage from './pages/PaymentPage'; // <<<--- IMPORT PaymentPage
import NotFound from './pages/NotFound'; // Assuming you have this

// --- Protected Route Component (Using useAuth from AuthContext) ---
// Checks authentication status before rendering child route
const ProtectedRoute = ({ children, requiredStatus = 'trial' }: { children: JSX.Element, requiredStatus?: 'trial' | 'paid' }) => {
  // Get status from the actual AuthContext via useAuth hook
  const { isAuthenticated, userStatus, isLoading } = useAuth();

  if (isLoading) {
    return <div>Loading Access...</div>; // Or your loading component
  }

  if (!isAuthenticated) {
    console.log("ProtectedRoute: Not authenticated, redirecting to /");
    return <Navigate to="/" replace />;
  }

  if (requiredStatus === 'paid' && userStatus !== 'paid') {
    console.log(`ProtectedRoute: Paid status required, user status is ${userStatus}. Redirecting to /start`);
    return <Navigate to="/start" replace />; // Or to /upgrade page
  }

  return children; // Render the component if authorized
};
// --- End Protected Route Component ---


function App() {
  return (
    // ThemeProvider wraps everything
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
              <Route path="/start" element={<ProtectedRoute requiredStatus='trial'><MainAppEntry /></ProtectedRoute>} />
              <Route path="/treatment-1" element={<ProtectedRoute requiredStatus='trial'><Treatment1 /></ProtectedRoute>} />

              {/* --- Payment Page Route --- */}
              {/* Requires trial access to reach */}
              <Route path="/upgrade" element={<ProtectedRoute requiredStatus='trial'><PaymentPage /></ProtectedRoute>} />
              {/* --- END Payment Page Route --- */}

              {/* --- Paid Content Routes --- */}
              <Route path="/treatment-2" element={<ProtectedRoute requiredStatus='paid'><Treatment2 /></ProtectedRoute>} />
              <Route path="/treatment-3" element={<ProtectedRoute requiredStatus='paid'><Treatment3 /></ProtectedRoute>} />
              <Route path="/treatment-4" element={<ProtectedRoute requiredStatus='paid'><Treatment4 /></ProtectedRoute>} />
              <Route path="/treatment-5" element={<ProtectedRoute requiredStatus='paid'><Treatment5 /></ProtectedRoute>} />
              <Route path="/follow-up" element={<ProtectedRoute requiredStatus='paid'><FollowUp /></ProtectedRoute>} />

              {/* --- Catch-all --- */}
              <Route path="*" element={<Navigate to="/" replace />} /> {/* Redirect unknown to landing */}
              {/* OR Use your NotFound component if preferred */}
              {/* <Route path="*" element={<NotFound />} /> */}

            </Routes>
            <Toaster /> {/* Renders toast notifications */}
          </Router>
        </SidebarProvider>
      </RecordingProvider>
    </ThemeProvider>
  );
}

// IMPORTANT: AuthProvider needs to wrap ThemeProvider OR App in main.tsx
// It was likely missed in the previous main.tsx update. Ensure main.tsx looks like:
/*
// src/main.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { ThemeProvider } from './components/theme-provider.tsx';
import { AuthProvider } from './contexts/AuthContext'; // <<<--- IMPORT AuthProvider

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthProvider>  // <<<--- AuthProvider should wrap ThemeProvider/App
      <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
        <App />
      </ThemeProvider>
    </AuthProvider>
  </React.StrictMode>,
);
*/


export default App;