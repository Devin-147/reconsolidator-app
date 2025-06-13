// FILE: src/contexts/AuthContext.tsx

import React, { createContext, useState, useContext, useEffect, ReactNode, useCallback } from 'react';

export type UserAccessLevel = 'loading' | 'none' | 'not_found' | 'trial' | 'standard_lifetime' | 'premium_lifetime';
// UserStatus can be simplified or deprecated if accessLevel becomes primary
export type UserStatus = 'loading' | 'none' | 'trial' | 'paid' | 'not_found'; 

interface AuthContextType {
  userEmail: string | null;
  userStatus: UserStatus;         // Kept for general status, might be deprecated
  accessLevel: UserAccessLevel; // New state for specific tier
  isLoading: boolean;
  checkAuthStatus: () => Promise<void>; 
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
  const [accessLevel, setAccessLevel] = useState<UserAccessLevel>('loading'); // Initialize accessLevel
  
  console.log(`AuthContext State Init/Update: userStatus='${userStatus}', accessLevel='${accessLevel}'`);

  const isLoading = userStatus === 'loading' || accessLevel === 'loading';

  const checkAuthStatus = useCallback(async () => {
    const emailToUse = userEmail;

    if (!emailToUse) {
      console.log("AuthContext checkAuthStatus: No email, setting status to 'none', accessLevel to 'none'");
      if (userStatus !== 'none') setUserStatus('none');
      if (accessLevel !== 'none') setAccessLevel('none');
      console.log(`AuthContext State Update: userStatus='none', accessLevel='none' (no email)`);
      try { localStorage.removeItem('reconsolidator_user_email'); } catch {}
      return;
    }

    console.log(`AuthContext checkAuthStatus: For ${emailToUse}. Current: status='${userStatus}', access='${accessLevel}'`);
    if (userStatus !== 'loading') setUserStatus('loading');
    if (accessLevel !== 'loading') setAccessLevel('loading');
    console.log(`AuthContext State Update: userStatus='loading', accessLevel='loading' (fetching)`);

    try {
      console.log(`AuthContext checkAuthStatus: Fetching /api/get-user-status?email=${encodeURIComponent(emailToUse)}`);
      const response = await fetch(`/api/get-user-status?email=${encodeURIComponent(emailToUse)}`);
      console.log(`AuthContext checkAuthStatus: API Response status: ${response.status}`);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`AuthContext checkAuthStatus: API error ${response.status}`, errorText);
        setUserStatus('none'); setAccessLevel('none');
        console.log(`AuthContext State Update: userStatus='none', accessLevel='none' (API error ${response.status})`);
        return;
      }

      const data = await response.json();
      console.log("AuthContext checkAuthStatus: Received data from API:", data);
      
      let apiUserStatus: UserStatus = data.userStatus || 'none';
      let apiAccessLevel: UserAccessLevel = data.accessLevel || 'none';

      // --- TEMPORARY BYPASS FOR TESTING PREMIUM FEATURES ---
      const FORCE_PREMIUM_FOR_TESTING = true; 
      const testUserEmailForPremiumBypass = "ux8@me.com"; 

      if (FORCE_PREMIUM_FOR_TESTING && emailToUse && emailToUse.toLowerCase() === testUserEmailForPremiumBypass.toLowerCase()) {
          console.warn(`AuthContext: FORCING 'premium_lifetime' access for ${emailToUse}. Original API: status='${apiUserStatus}', accessLevel='${apiAccessLevel}'.`);
          apiUserStatus = 'paid'; // Keep userStatus as 'paid' if forcing premium
          apiAccessLevel = 'premium_lifetime';
      }
      // --- END TEMPORARY BYPASS ---

      console.log(`AuthContext checkAuthStatus: Setting userStatus='${apiUserStatus}', accessLevel='${apiAccessLevel}' for ${emailToUse}`);
      setUserStatus(apiUserStatus);
      setAccessLevel(apiAccessLevel);
      console.log(`AuthContext State Update: userStatus='${apiUserStatus}', accessLevel='${apiAccessLevel}' (from API or bypass)`);

    } catch (error) {
      console.error('AuthContext checkAuthStatus: Failed to fetch auth status:', error);
      setUserStatus('none'); setAccessLevel('none');
      console.log(`AuthContext State Update: userStatus='none', accessLevel='none' (fetch error)`);
    }
  }, [userEmail, userStatus, accessLevel]); // Added accessLevel


  useEffect(() => {
    const initialEmailFromStorage = localStorage.getItem('reconsolidator_user_email');
    console.log("AuthContext Mount useEffect: initialEmail from localStorage =", initialEmailFromStorage);
    if (initialEmailFromStorage) {
        if (initialEmailFromStorage !== userEmail) {
            setUserEmail(initialEmailFromStorage);
        } else {
             if (userStatus === 'loading' || userStatus === 'none' || accessLevel === 'loading' || accessLevel === 'none') {
                 console.log("AuthContext Mount useEffect: Triggering checkAuthStatus from mount.");
                 checkAuthStatus();
             }
        }
    } else {
      if (userStatus !== 'loading' && userStatus !== 'none') setUserStatus('none');
      if (accessLevel !== 'loading' && accessLevel !== 'none') setAccessLevel('none');
      if ((userStatus === 'loading' && !userEmail) || (accessLevel === 'loading' && !userEmail)) {
         setUserStatus('none'); setAccessLevel('none');
      }
      console.log(`AuthContext State Update on Mount (no email in LS): userStatus='${userStatus}', accessLevel='${accessLevel}'`);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps 
  }, [checkAuthStatus]); // Only checkAuthStatus, as it depends on userEmail internally


  const value = { userEmail, userStatus, accessLevel, isLoading, checkAuthStatus, setUserEmail };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) { throw new Error('useAuth must be used within an AuthProvider'); }
  // isAuthenticated can remain based on general access, or you might add a new flag like 'hasActiveAccess'
  const isAuthenticated = !context.isLoading && context.accessLevel !== 'none' && context.accessLevel !== 'not_found';
  return { ...context, isAuthenticated };
};