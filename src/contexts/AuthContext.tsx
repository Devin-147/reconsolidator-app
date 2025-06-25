// FILE: src/contexts/AuthContext.tsx
// Adds setUserEmail to the context

import React, { createContext, useState, useContext, useEffect, ReactNode, useCallback } from 'react';

export type UserAccessLevel = 'loading' | 'none' | 'not_found' | 'trial' | 'standard_lifetime' | 'premium_lifetime';
export type UserStatus = 'loading' | 'none' | 'trial' | 'paid' | 'not_found'; 

interface AuthContextType {
  userEmail: string | null;
  setUserEmail: React.Dispatch<React.SetStateAction<string | null>>; // <<< ADDED THIS LINE
  userStatus: UserStatus;        
  accessLevel: UserAccessLevel; 
  isLoading: boolean;
  checkAuthStatus: () => Promise<void>; 
  // userId: string | null; // Not currently provided or used by LandingPage based on errors
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [userEmail, setUserEmail] = useState<string | null>(() => {
    try {
      const initialEmail = localStorage.getItem('reconsolidator_user_email') || null;
      return initialEmail;
    } catch { return null; }
  });

  const [userStatus, setUserStatus] = useState<UserStatus>('loading');
  const [accessLevel, setAccessLevel] = useState<UserAccessLevel>('loading');
  const isLoading = userStatus === 'loading' || accessLevel === 'loading';

  const checkAuthStatus = useCallback(async () => {
    const emailToUse = userEmail;
    if (!emailToUse) {
      if (userStatus !== 'none') setUserStatus('none');
      if (accessLevel !== 'none') setAccessLevel('none');
      try { localStorage.removeItem('reconsolidator_user_email'); } catch {}
      return;
    }
    // Only set to loading if not already fetching for this specific email
    if (userStatus !== 'loading' && accessLevel !== 'loading') {
         setUserStatus('loading'); setAccessLevel('loading');
    }
    try {
      const response = await fetch(`/api/get-user-status?email=${encodeURIComponent(emailToUse)}`);
      if (!response.ok) { 
        console.error(`AuthContext: API error ${response.status} fetching user status.`);
        throw new Error(`API error ${response.status}`); 
      }
      const data = await response.json();
      let apiUserStatus: UserStatus = data.userStatus || 'none';
      let apiAccessLevel: UserAccessLevel = data.accessLevel || 'none';
      
      const FORCE_PREMIUM_FOR_TESTING = true; 
      const testUserEmailForPremiumBypass = "ux8@me.com"; 
      if (FORCE_PREMIUM_FOR_TESTING && emailToUse && emailToUse.toLowerCase() === testUserEmailForPremiumBypass.toLowerCase()) {
          console.warn(`AuthContext: FORCING 'premium_lifetime' access for ${emailToUse}. Original API: status='${apiUserStatus}', accessLevel='${apiAccessLevel}'.`);
          apiUserStatus = 'paid'; 
          apiAccessLevel = 'premium_lifetime';
      }
      setUserStatus(apiUserStatus);
      setAccessLevel(apiAccessLevel);
    } catch (error) {
      console.error('AuthContext checkAuthStatus: Failed to fetch auth status:', error);
      setUserStatus('none'); 
      setAccessLevel('none');
    }
  }, [userEmail, userStatus, accessLevel]); // Ensure all dependencies are listed


  useEffect(() => {
    const initialEmailFromStorage = localStorage.getItem('reconsolidator_user_email');
    if (initialEmailFromStorage) {
        if (initialEmailFromStorage !== userEmail) {
            setUserEmail(initialEmailFromStorage); // This will trigger re-check via userEmail dependency on checkAuthStatus
        } else {
             // If email is already set and matches storage, check status if it's initial loading states
             if (userStatus === 'loading' || userStatus === 'none' || accessLevel === 'loading' || accessLevel === 'none') {
                 checkAuthStatus();
             }
        }
    } else {
      // No email in storage, ensure states are 'none' if not already loading
      if (userStatus !== 'loading') setUserStatus('none');
      if (accessLevel !== 'loading') setAccessLevel('none');
    }
  // This effect should run when userEmail changes (e.g. after LandingPage sets it)
  // or on initial mount to check localStorage.
  }, [userEmail, checkAuthStatus]); // Simplified dependencies

  // Value provided by the context
  const value = { 
    userEmail, 
    setUserEmail, // <<< PROVIDE setUserEmail
    userStatus, 
    accessLevel, 
    isLoading, 
    checkAuthStatus,
    // userId: null // Example if userId were needed, derived from userEmail or session
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) { throw new Error('useAuth must be used within an AuthProvider'); }
  // Determine isAuthenticated based on accessLevel implying some form of valid session
  const isAuthenticated = !context.isLoading && context.accessLevel !== 'none' && context.accessLevel !== 'not_found';
  return { ...context, isAuthenticated };
};