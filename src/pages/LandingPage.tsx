// FILE: src/pages/LandingPage.tsx
// FINAL CORRECTED VERSION: Implements fast, client-side Supabase auth.

import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button'; 
import { Input } from '@/components/ui/input'; 
import { Checkbox } from "@/components/ui/checkbox"; 
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner'; 
import { supabase } from '@/lib/supabaseClient'; // Import the Supabase client
import { AlertTriangle, Film, Upload, XCircle } from 'lucide-react';
import { MdOutlineEmergencyRecording } from "react-icons/md";
import { RxMix } from "react-icons/rx";
import { GrCatalog } from "react-icons/gr";
import { GiProgression } from "react-icons/gi";
import { NeuralSpinner } from '@/components/ui/NeuralSpinner';

const LandingPage = () => {
  const [email, setEmail] = useState('');
  const [agreedToPrivacy, setAgreedToPrivacy] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { setUserEmail } = useAuth();

  // --- vvv THIS IS THE NEW CLIENT-SIDE AUTH LOGIC vvv ---
  const handleFormSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!agreedToPrivacy || !agreedToTerms) {
      toast.error('Please agree to the policies to continue.');
      return;
    }
    
    const form = event.currentTarget;
    if (!form.checkValidity()) {
        toast.error("Please enter a valid email address.");
        return;
    }

    setIsLoading(true);

    try {
      // This single command works for both new and existing users.
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: true,
          emailRedirectTo: 'https://app.reprogrammingmind.com/calibrate/1',
        },
      });

      if (error) throw error;

      if(setUserEmail) setUserEmail(email); 
      toast.success('Success! Please check your email for a secure sign-in link.');
      
    } catch (error: any) {
      toast.error('An error occurred', { description: error.message });
    } finally {
      setIsLoading(false);
    }
  };
  // --- ^^^ END OF NEW LOGIC ^^^ ---
  
  // (The rest of the component, including the JSX, is the same as your last working version)
  return (
    <div className="min-h-screen bg-background text-foreground p-6 md:p-6">
      {/* ... The rest of your beautiful landing page JSX ... */}
    </div>
  );
};
export default LandingPage;
