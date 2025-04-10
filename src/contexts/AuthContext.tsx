// src/contexts/AuthContext.tsx
import React, { createContext, useState, useContext, useEffect, ReactNode, useCallback } from 'react';

type UserStatus = 'loading' | 'none' | 'trial' | 'paid';

interface AuthContextType {
  userEmail: string | null;
  userStatus: UserStatus;
  isLoading: boolean;
  checkAuthStatus: () => Promise<void>; // Function to trigger status check
  setUserEmailAndStatus: (email: string | null, status: UserStatus) => void; // To set status after signup/login
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [userEmail, setUserEmail] = useState<string | null>(() => {
    // Try to get email from localStorage on initial load
    // THIS IS INSECURE FOR AUTH DECISIONS - JUST FOR IDENTIFICATION
    // Replace with secure session/token later
    try {
      return localStorage.getItem('reconsolidator_user_email') || null;
    } catch { return null; }
  });
  const [userStatus, setUserStatus] = useState<UserStatus>('loading'); // Start in loading state
  const isLoading = userStatus === 'loading';

  // Function to fetch status from backend API
  const checkAuthStatus = useCallback(async () => {
    if (!userEmail) {
      console.log("AuthContext: No email found, setting status to 'none'");
      setUserStatus('none');
      return;
    }

    console.log(`AuthContext: Checking status for ${userEmail}...`);
    setUserStatus('loading'); // Set loading before fetch
    try {
      // Use query parameter (INSECURE - REPLACE WITH SECURE METHOD LATER)
      const response = await fetch(`/api/get-user-status?email=${encodeURIComponent(userEmail)}`);

      if (response.status === 404) {
         console.log("AuthContext: User not found via API.");
         setUserEmail(null); // Clear invalid email if needed
         localStorage.removeItem('reconsolidator_user_email');
         setUserStatus('none');
         return;
      }

      if (!response.ok) {
        throw new Error(`API Error: ${response.statusText}`);
      }

      const data = await response.json();
      console.log("AuthContext: Received status from API:", data);
      setUserStatus(data.userStatus || 'none'); // Update status based on API response

    } catch (error) {
      console.error('AuthContext: Failed to fetch auth status:', error);
      setUserStatus('none'); // Default to 'none' on error
    }
  }, [userEmail]); // Dependency: userEmail

  // Function to manually set email (e.g., after signup) and trigger check
  const setUserEmailAndStatus = (email: string | null, status: UserStatus = 'loading') => {
     setUserEmail(email);
     if (email) {
        try { // Also update insecure localStorage for persistence across refresh
           localStorage.setItem('reconsolidator_user_email', email);
        } catch {}
     } else {
         localStorage.removeItem('reconsolidator_user_email');
     }
     setUserStatus(status); // Set initial status (e.g., 'trial' or 'loading')
     if (status === 'loading' && email) {
        checkAuthStatus(); // Trigger fetch immediately if setting email for first time
     }
  }

  // Fetch status on initial load if email exists
  useEffect(() => {
    if(userEmail){
        checkAuthStatus();
    } else {
        setUserStatus('none'); // No email, no access
    }
  }, [checkAuthStatus, userEmail]); // Run only when checkAuthStatus or userEmail changes


  const value = {
    userEmail,
    userStatus,
    isLoading,
    checkAuthStatus, // Expose function to allow re-checking status
    setUserEmailAndStatus
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook to use the AuthContext
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  // Add isAuthenticated derived state for convenience in ProtectedRoute
  const isAuthenticated = !context.isLoading && context.userStatus !== 'none';
  return { ...context, isAuthenticated };
};