// FILE: src/contexts/AuthContext.tsx

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { supabase } from '@/supabaseClient'; // For actual auth later
import { toast } from 'sonner';

export type UserStatus = 'loading' | 'none' | 'trial' | 'paid' | 'not_found';
export type UserAccessLevel = 'loading' | 'none' | 'trial' | 'standard_lifetime' | 'premium_lifetime' | 'not_found';

interface AuthContextType {
  isAuthenticated: boolean;
  userEmail: string | null;
  userStatus: UserStatus;
  accessLevel: UserAccessLevel; 
  isLoading: boolean;
  login: (email: string) => Promise<boolean>; // Simplified for now
  logout: () => Promise<void>;
  checkAuthStatus: () => Promise<void>;
  setGlobalUserStatus: (status: UserStatus, level: UserAccessLevel, email?: string | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const FORCE_PREMIUM_FOR_TESTING = true; // Keep this true for testing all features
const testUserEmailForPremiumBypass = "ux8@me.com"; // Your test email

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userStatus, setUserStatus] = useState<UserStatus>('loading');
  const [accessLevel, setAccessLevel] = useState<UserAccessLevel>('loading');
  const [isLoading, setIsLoading] = useState(true);
  const isAuthenticated = userStatus !== 'none' && userStatus !== 'not_found' && userStatus !== 'loading';

  const setGlobalUserStatus = useCallback((status: UserStatus, level: UserAccessLevel, email: string | null = null) => {
    setUserStatus(status);
    setAccessLevel(level);
    if (email) setUserEmail(email);
    setIsLoading(false);
    console.log(`AuthContext State Update: userStatus='${status}', accessLevel='${level}'`);
  }, []);

  const checkAuthStatus = useCallback(async () => {
    console.log(`AuthContext checkAuthStatus: For ${userEmail || "unknown user"}. Current: status='${userStatus}', access='${accessLevel}'`);
    setIsLoading(true);
    setGlobalUserStatus('loading', 'loading', userEmail); // Set to loading

    const emailToUse = userEmail || localStorage.getItem('userEmail');
    if (!emailToUse) {
      console.log("AuthContext checkAuthStatus: No email, setting to 'none'");
      setGlobalUserStatus('none', 'none');
      return;
    }
    if (userEmail !== emailToUse) setUserEmail(emailToUse);


    // --- ALWAYS BYPASS API FOR ux8@me.com WHEN TESTING ---
    if (FORCE_PREMIUM_FOR_TESTING && emailToUse.toLowerCase() === testUserEmailForPremiumBypass.toLowerCase()) {
        console.warn(`AuthContext: ALWAYS FORCING 'premium_lifetime' access for ${emailToUse} due to testing flag. API call SKIPPED.`);
        setGlobalUserStatus('paid', 'premium_lifetime', emailToUse);
        return; // IMPORTANT: Return here to skip the fetch
    }
    // --- END OF ALWAYS BYPASS ---

    // This fetch will only happen if FORCE_PREMIUM_FOR_TESTING is false or email doesn't match
    try {
      console.log(`AuthContext checkAuthStatus: Fetching /api/get-user-status?email=${encodeURIComponent(emailToUse)}`);
      const response = await fetch(`/api/get-user-status?email=${encodeURIComponent(emailToUse)}`);
      console.log("AuthContext checkAuthStatus: API Response status:", response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("AuthContext checkAuthStatus: API error response:", errorText);
        throw new Error(`API Error ${response.status}: ${response.statusText}`);
      }
      const data = await response.json();
      console.log("AuthContext checkAuthStatus: Received data from API:", data);

      let receivedStatus: UserStatus = data.userStatus || 'none';
      let receivedAccessLevel: UserAccessLevel = data.accessLevel || 'none';

      setGlobalUserStatus(receivedStatus, receivedAccessLevel, emailToUse);

    } catch (error) {
      console.error("AuthContext checkAuthStatus: Fetch error or non-OK response:", error);
      toast.error("Could not verify user status. Please try again later.");
      setGlobalUserStatus('none', 'none', emailToUse); // Default to none on error
    }
  }, [userEmail, userStatus, accessLevel, setGlobalUserStatus]); // Added userStatus and accessLevel to deps

  useEffect(() => {
    const initialEmail = localStorage.getItem('userEmail');
    console.log("AuthContext Mount useEffect: initialEmail from localStorage =", initialEmail);
    if (initialEmail) {
      setUserEmail(initialEmail);
      // Trigger checkAuthStatus if email exists but status is still initial 'loading'
      if (userStatus === 'loading' || accessLevel === 'loading') {
         console.log("AuthContext Mount useEffect: Triggering checkAuthStatus from mount.");
         checkAuthStatus();
      }
    } else {
      setIsLoading(false);
      setUserStatus('none');
      setAccessLevel('none');
    }
  }, [checkAuthStatus]); // checkAuthStatus should be stable due to useCallback

  const login = async (email: string): Promise<boolean> => {
    setIsLoading(true);
    // For now, just store email and set to trial locally, then check status
    // Actual Supabase auth `signInWithOtp` would go here
    localStorage.setItem('userEmail', email);
    setUserEmail(email);
    // Assume new login means trial, then checkAuthStatus will verify/update
    // For testing, directly force premium if it's the test user
    if (FORCE_PREMIUM_FOR_TESTING && email.toLowerCase() === testUserEmailForPremiumBypass.toLowerCase()) {
        setGlobalUserStatus('paid', 'premium_lifetime', email);
        return true;
    }
    // For other users, or if not forcing, set to trial and let checkAuthStatus resolve
    setGlobalUserStatus('trial', 'trial', email); 
    await checkAuthStatus(); // This will call the (potentially crashing) API for non-test users
    return isAuthenticated; // Return based on status after check
  };

  const logout = async () => {
    setIsLoading(true);
    // await supabase.auth.signOut(); // Actual Supabase logout
    localStorage.removeItem('userEmail');
    localStorage.removeItem('currentTreatmentStep'); // Clear any treatment progress
    localStorage.removeItem('selectedPredictionErrors_T1'); // etc.
    setUserEmail(null);
    setGlobalUserStatus('none', 'none');
    console.log("AuthContext: User logged out.");
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, userEmail, userStatus, accessLevel, isLoading, login, logout, checkAuthStatus, setGlobalUserStatus }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};