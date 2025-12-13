// FILE: src/contexts/AuthContext.tsx
// FINAL CORRECTED VERSION: Uses onAuthStateChange to reliably handle magic link logins.

import React, { createContext, useState, useContext, useEffect, ReactNode, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient'; // Import the Supabase client
import { Session } from '@supabase/supabase-js';

export type UserAccessLevel = 'loading' | 'none' | 'not_found' | 'trial' | 'standard_lifetime' | 'premium_lifetime';
export type UserStatus = 'loading' | 'none' | 'trial' | 'paid' | 'not_found'; 

interface AuthContextType {
  userEmail: string | null;
  setUserEmail: (email: string | null) => void;
  userStatus: UserStatus;        
  accessLevel: UserAccessLevel; 
  isLoading: boolean;
  checkAuthStatus: (email: string) => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [userEmail, internalSetUserEmail] = useState<string | null>(null);
  const [userStatus, setUserStatus] = useState<UserStatus>('loading');
  const [accessLevel, setAccessLevel] = useState<UserAccessLevel>('loading');
  const [session, setSession] = useState<Session | null>(null);

  const isLoading = userStatus === 'loading' || accessLevel === 'loading' || session === undefined; 
  
  const setUserEmail = (email: string | null) => {
    if (email) {
      localStorage.setItem('reconsolidator_user_email', email);
    } else {
      localStorage.removeItem('reconsolidator_user_email');
    }
    internalSetUserEmail(email);
  };

  const checkAuthStatus = useCallback(async (email: string) => {
    if (!email) {
      setUserStatus('none');
      setAccessLevel('none');
      return;
    }
    
    // This function can now be simpler, as we get the user data from the session.
    // However, if you store custom roles in a separate 'users' table, you still need a fetch.
    // For now, let's assume access level is determined by the existence of a session.
    
    // A placeholder for fetching custom data from your 'users' table if needed in the future.
    // const { data } = await supabase.from('users').select('access_level').eq('email', email).single();
    // setAccessLevel(data?.access_level || 'trial');

    setUserStatus('trial'); // Or 'paid' based on the fetch above
    setAccessLevel('trial');

  }, []);

  // --- vvv THIS IS THE NEW, CRUCIAL LOGIC vvv ---
  useEffect(() => {
    // 1. Immediately check for a session on initial load.
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      const email = session?.user?.email || null;
      setUserEmail(email);
      if (email) {
        checkAuthStatus(email);
      } else {
        setUserStatus('none');
        setAccessLevel('none');
      }
    });

    // 2. Listen for any auth event (SIGN_IN, SIGN_OUT, TOKEN_REFRESHED).
    // This is what catches the magic link and updates the session reliably.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      const email = session?.user?.email || null;
      setUserEmail(email);
      if (email) {
        checkAuthStatus(email);
      } else {
        setUserStatus('none');
        setAccessLevel('none');
      }
    });

    // 3. Clean up the listener when the component unmounts.
    return () => subscription.unsubscribe();
  }, [checkAuthStatus]);
  // --- ^^^ END OF NEW LOGIC ^^^ ---

  const isAuthenticated = !!session?.user;

  const value = { userEmail, setUserEmail, userStatus, accessLevel, isLoading, checkAuthStatus, isAuthenticated };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) { throw new Error('useAuth must be used within an AuthProvider'); }
  return context;
};
