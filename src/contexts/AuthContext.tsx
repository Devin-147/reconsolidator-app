// src/contexts/AuthContext.tsx
import React, { createContext, useState, useContext, useEffect, ReactNode, useCallback } from 'react';

type UserStatus = 'loading' | 'none' | 'trial' | 'paid';

interface AuthContextType {
  userEmail: string | null;
  userStatus: UserStatus;
  isLoading: boolean;
  checkAuthStatus: () => Promise<void>; // <<< NO ARGUMENT DEFINED HERE
  // Expose setUserEmail directly if LandingPage needs it for immediate UI feedback
  setUserEmail: React.Dispatch<React.SetStateAction<string | null>>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [userEmail, setUserEmail] = useState<string | null>(() => {
    try {
      const initialEmail = localStorage.getItem('reconsolidator_user_email') || null;
      console.log(`AuthContext Initial Load: Email from localStorage = ${initialEmail}`);
      return initialEmail;
    } catch { return null; }
  });
  const [userStatus, setUserStatus] = useState<UserStatus>('loading');
  console.log(`AuthContext State Init/Update: userStatus = '${userStatus}'`);

  const isLoading = userStatus === 'loading';

  // checkAuthStatus uses the userEmail from the component's state scope
  const checkAuthStatus = useCallback(async () => { // <<< NO ARGUMENT DEFINED HERE
    const emailToUse = userEmail; // Use state directly

    if (!emailToUse) {
      console.log("AuthContext checkAuthStatus: No email in state, setting status to 'none'");
      if (userStatus !== 'none') setUserStatus('none');
      try { localStorage.removeItem('reconsolidator_user_email'); } catch {}
      return;
    }

    console.log(`AuthContext checkAuthStatus: Checking status for ${emailToUse} from state...`);
    if (userStatus !== 'loading') setUserStatus('loading');

    try {
      console.log(`AuthContext checkAuthStatus: Fetching /api/get-user-status?email=${encodeURIComponent(emailToUse)}`);
      const response = await fetch(`/api/get-user-status?email=${encodeURIComponent(emailToUse)}`);
      console.log(`AuthContext checkAuthStatus: Fetch response status: ${response.status}`);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`AuthContext checkAuthStatus: API error - ${response.status} ${response.statusText}`, errorText);
        setUserStatus('none');
        if (response.status === 404) console.log("AuthContext checkAuthStatus: User not found (404), set status to 'none'.");
        return;
      }

      const data = await response.json();
      console.log("AuthContext checkAuthStatus: Received status from API:", data);
      const receivedStatus = data.userStatus || 'none';
      console.log(`AuthContext checkAuthStatus: Setting userStatus to '${receivedStatus}' for email ${emailToUse}`);
      setUserStatus(receivedStatus);

    } catch (error) {
      console.error('AuthContext checkAuthStatus: Failed to fetch auth status:', error);
      console.log("AuthContext checkAuthStatus: Setting userStatus to 'none' due to error.");
      setUserStatus('none');
    }
  }, [userEmail, userStatus]); // Dependencies include userEmail (to get latest value) and userStatus (to avoid loops/set loading)


  // useEffect: Check status on initial mount if email exists in localStorage
  useEffect(() => {
    const initialEmail = localStorage.getItem('reconsolidator_user_email');
    console.log("AuthContext Mount useEffect: initialEmail =", initialEmail);
    if (initialEmail) {
        // If email exists, ensure it's in state AND trigger check
        if (initialEmail !== userEmail) {
            setUserEmail(initialEmail); // Update state if localStorage differs
        }
        // Only trigger check if status isn't already set (or still loading from init)
        // This might need adjustment based on exact desired initial load behavior
         if (userStatus === 'loading' || userStatus === 'none') {
             checkAuthStatus();
         }
    } else {
      // No email found, set status directly to 'none'
      setUserStatus('none');
    }
    // This effect runs once on mount, and potentially again if checkAuthStatus identity changes (it shouldn't often)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checkAuthStatus]); // checkAuthStatus dependency is okay here for mount logic


  const value = { userEmail, userStatus, isLoading, checkAuthStatus, setUserEmail }; // Expose setUserEmail if needed

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// useAuth hook remains the same
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) { throw new Error('useAuth must be used within an AuthProvider'); }
  const isAuthenticated = !context.isLoading && context.userStatus !== 'none';
  return { ...context, isAuthenticated };
};