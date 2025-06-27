// FILE: src/contexts/AuthContext.tsx

import React, { createContext, useState, useContext, useEffect, ReactNode, useCallback } from 'react';

export type UserAccessLevel = 'loading' | 'none' | 'not_found' | 'trial' | 'standard_lifetime' | 'premium_lifetime';
export type UserStatus = 'loading' | 'none' | 'trial' | 'paid' | 'not_found'; 

interface AuthContextType {
  userEmail: string | null;
  setUserEmail: React.Dispatch<React.SetStateAction<string | null>>;
  userStatus: UserStatus;        
  accessLevel: UserAccessLevel; 
  isLoading: boolean; // True if userStatus OR accessLevel is 'loading'
  checkAuthStatus: (emailOverride?: string) => Promise<void>; // Allow overriding email for immediate check
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [userEmail, setUserEmail] = useState<string | null>(() => {
    try {
      const initialEmail = localStorage.getItem('reconsolidator_user_email');
      console.log(`AuthContext Init: Email from localStorage = ${initialEmail}`);
      return initialEmail || null; 
    } catch { return null; }
  });

  const [userStatus, setUserStatus] = useState<UserStatus>('loading');
  const [accessLevel, setAccessLevel] = useState<UserAccessLevel>('loading');
  
  // isLoading is true if EITHER status OR accessLevel is 'loading'
  const isLoading = userStatus === 'loading' || accessLevel === 'loading'; 
  
  console.log(`AuthContext State: userEmail='${userEmail}', userStatus='${userStatus}', accessLevel='${accessLevel}', isLoading=${isLoading}`);

  const checkAuthStatus = useCallback(async (emailOverride?: string) => {
    const emailToUse = emailOverride || userEmail; // Prioritize override for immediate checks

    console.log(`AuthContext checkAuthStatus: Called for email: '${emailToUse}'. Current status: '${userStatus}', access: '${accessLevel}'`);

    if (!emailToUse) {
      console.log("AuthContext checkAuthStatus: No email provided, setting to 'none'.");
      setUserStatus('none');
      setAccessLevel('none');
      try { localStorage.removeItem('reconsolidator_user_email'); } catch {}
      return;
    }

    // Set to loading only if not already fetching (though this check is tricky with async)
    // More robustly: always set to loading at start of fetch, ensure all paths set a final state.
    setUserStatus('loading');
    setAccessLevel('loading');
    console.log(`AuthContext checkAuthStatus: Set to loading for '${emailToUse}'.`);

    try {
      const response = await fetch(`/api/get-user-status?email=${encodeURIComponent(emailToUse)}`);
      console.log(`AuthContext checkAuthStatus: API response status for '${emailToUse}': ${response.status}`);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`AuthContext checkAuthStatus: API error ${response.status} for '${emailToUse}'. Body: ${errorText}`);
        // Even on API error, set to a defined non-loading state
        setUserStatus('not_found'); // Or 'none' if more appropriate for API errors
        setAccessLevel('not_found');
        return;
      }

      const data = await response.json();
      console.log("AuthContext checkAuthStatus: Received data from API:", data);
      
      let apiUserStatus: UserStatus = data.userStatus || 'none';
      let apiAccessLevel: UserAccessLevel = data.accessLevel || 'none';

      const FORCE_PREMIUM_FOR_TESTING = true; 
      const testUserEmailForPremiumBypass = "ux8@me.com"; 
      if (FORCE_PREMIUM_FOR_TESTING && emailToUse.toLowerCase() === testUserEmailForPremiumBypass.toLowerCase()) {
          console.warn(`AuthContext: FORCING 'premium_lifetime' access for ${emailToUse}. Original API: status='${apiUserStatus}', accessLevel='${apiAccessLevel}'.`);
          apiUserStatus = 'paid'; 
          apiAccessLevel = 'premium_lifetime';
      }

      setUserStatus(apiUserStatus);
      setAccessLevel(apiAccessLevel);
      console.log(`AuthContext checkAuthStatus: Final status for '${emailToUse}': status='${apiUserStatus}', accessLevel='${apiAccessLevel}'`);

    } catch (error) {
      console.error(`AuthContext checkAuthStatus: Failed to fetch auth status for '${emailToUse}':`, error);
      setUserStatus('none'); 
      setAccessLevel('none');
    }
  }, [userEmail]); // Depends on userEmail from state to use as default

  // Effect to run checkAuthStatus on initial mount if email exists in localStorage,
  // or when userEmail state changes.
  useEffect(() => {
    console.log("AuthContext useEffect [userEmail]: userEmail changed to or initialized as:", userEmail);
    if (userEmail) { // If there's an email (from localStorage initially or set by LandingPage)
        console.log("AuthContext useEffect [userEmail]: Calling checkAuthStatus because userEmail is present.");
        checkAuthStatus(userEmail); // Pass current userEmail to ensure it uses the latest
    } else {
        // No email, ensure states are 'none' if currently 'loading' from initial state
        if (userStatus === 'loading') setUserStatus('none');
        if (accessLevel === 'loading') setAccessLevel('none');
        console.log("AuthContext useEffect [userEmail]: No userEmail, status set to 'none'.");
    }
  }, [userEmail, checkAuthStatus]); // checkAuthStatus is memoized

  const value = { userEmail, setUserEmail, userStatus, accessLevel, isLoading, checkAuthStatus };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) { throw new Error('useAuth must be used within an AuthProvider'); }
  const isAuthenticated = !context.isLoading && context.accessLevel !== 'none' && context.accessLevel !== 'not_found';
  return { ...context, isAuthenticated };
};