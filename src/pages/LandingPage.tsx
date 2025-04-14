// src/pages/LandingPage.tsx
import React, { useState } from 'react'; // Import React
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { MdOutlineEmergencyRecording } from "react-icons/md";
import { RxMix } from "react-icons/rx";
import { GrCatalog } from "react-icons/gr";
import { FaCalendarCheck } from "react-icons/fa6";
import { GiProgression } from "react-icons/gi";
// Import reCAPTCHA components if using it
// import ReCAPTCHA from "react-google-recaptcha";
// import { useRef } from 'react';

const LandingPage = () => {
  const [email, setEmail] = useState('');
  const [agreedPrivacy, setAgreedPrivacy] = useState(false);
  const [agreedTerms, setAgreedTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const navigate = useNavigate();
  const { setUserEmailAndStatus } = useAuth();
  // Add ref/state for reCAPTCHA if implemented
  // const recaptchaRef = useRef<ReCAPTCHA>(null);
  // const [recaptchaToken, setRecaptchaToken] = useState<string | null>(null);

  // Add reCAPTCHA onChange handler if implemented
  // const onRecaptchaChange = (token: string | null) => {
  //   setRecaptchaToken(token);
  // };

  const handleFormSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage('');

    if (!agreedPrivacy || !agreedTerms) {
      setMessage('Please agree to the Privacy Policy and Terms & Conditions.');
      return;
    }
    // Add reCAPTCHA token check if implemented
    // if (!recaptchaToken) { setMessage('Please complete CAPTCHA.'); return; }

    setIsLoading(true);

    try {
      const response = await fetch('/api/request-access', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
         // Add token if using reCAPTCHA
        body: JSON.stringify({ email /*, token: recaptchaToken */ }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage('Success! Check your email. Redirecting you to start...');
         try {
            localStorage.setItem('reconsolidator_access_granted', 'true');
            localStorage.setItem('reconsolidator_user_email', email);
          } catch (e) { console.error("LocalStorage Error:", e); }
        setUserEmailAndStatus(email, 'trial');
        setAgreedPrivacy(false);
        setAgreedTerms(false);
        // Reset reCAPTCHA if implemented
        // recaptchaRef.current?.reset(); setRecaptchaToken(null);
        setTimeout(() => {
          navigate('/treatment-1'); // Corrected redirect
        }, 1500);
      } else {
        setMessage(data.error || 'An error occurred. Please try again.');
         // Reset reCAPTCHA if implemented
         // recaptchaRef.current?.reset(); setRecaptchaToken(null);
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Request Access API call failed:', error);
      setMessage('An error occurred. Please check your connection and try again.');
       // Reset reCAPTCHA if implemented
       // recaptchaRef.current?.reset(); setRecaptchaToken(null);
      setIsLoading(false);
    }
  };

  // Function to handle direct payment (optional, could redirect to a payment page)
  const handleDirectPay = () => {
    console.log('Trigger direct payment flow...');
    alert('Direct payment flow not implemented yet.');
  };


  return (
    // Using simpler structure now, applying styles directly
    <div className="min-h-screen bg-background text-foreground p-6 md:p-6">
       {/* Removed complex <header> */}
      <div className="max-w-4xl mx-auto space-y-16 md:space-y-24">        {/* --- Hero Section --- */}
        <section className="text-center space-y-4 pt-10"> {/* Reduced top padding */}
          <div className="flex justify-center mb-4">
            <img src="/images/logo.png" alt="Reconsolidator Logo" width="150" height="auto" />
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-white tracking-tight"> {/* Changed text color to white */}
            Reconsolidation Program
          </h1>
          <h2 className="text-3xl md:text-4xl font-semibold tracking-tight pt-2" style={{ color: '#7DFDFE' }}> {/* Added H2 with style */}
            Target a Memory to Rewrite for Good
          </h2>
          {/* --- END: Headline Changes --- */}
        </section>
        {/* --- Description Section --- */}
        <section className="flex flex-col items-center justify-between h-64"> {/* Adjust height as needed */}
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto pt-0"> {/* Removed padding top */}
            Let go of the past with proven Reconsolidation techniques—start with a free treatment and experience the difference for yourself.
          </p>
          <Button size="lg" className="mt-4 mb-4" onClick={() => document.getElementById('email-form')?.scrollIntoView({ behavior: 'smooth' })}>
            Try Treatment 1 Free
          </Button>
          <h2 className="text-2xl md:text-3xl font-semibold">Heal from an Emotional Memory in Just 5 Guided Treatments</h2>
        </section>
        {/* --- Pain Point / Benefit --- */}
        <section className="text-center space-y-3">
            <p className="text-md text-muted-foreground max-w-3xl mx-auto">
              Struggling with memories that won't let go—like a painful breakup, a lingering rejection, or a moment of guilt, anger, sadness or shame? The Reconsolidation program uses the science-backed Reconsolidation of Traumatic Memories (RTM) protocol to help you reprocess those memories and reduce their emotional impact. In studies, 90% of users saw significant relief from intrusive symptoms, and one user reduced their distress by 76% in a single session. You can too.
            </p>
        </section>

        {/* --- How It Works --- */}
        <section className="space-y-8">
          <h2 className="text-2xl md:text-3xl font-semibold text-center">How the Reconsolidation Program Works</h2>
          <p className="text-center text-muted-foreground">
            The program guides you through a simple, narrative-driven process to reprocess a specific memory to target in your mind—no distractions, just results. Here's how:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 text-center">
            <div className="p-4 border border-border rounded-lg bg-card">
              <div className="flex justify-center mb-4">
                <MdOutlineEmergencyRecording className="w-12 h-12 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">1. Narrate Your Memory</h3>
              <p className="text-sm text-muted-foreground">Decide which memory you want to reconsolidate.  Then choose a positive memory before the event and a positive memory after the event. We'll tailor the process to you.</p>
            </div>
            <div className="p-4 border border-border rounded-lg bg-card">
              <div className="flex justify-center mb-4">
                <RxMix className="w-12 h-12 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">2. Choose Mismatch Experiences</h3>
              <p className="text-sm text-muted-foreground">Select 11 novel experiences to create prediction errors for disrupting the memory's emotional hold, making it malleable for modification.</p>
            </div>
            <div className="p-4 border border-border rounded-lg bg-card">
              <div className="flex justify-center mb-4">
                <GrCatalog className="w-12 h-12 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">3. Follow the Guided Narrative</h3>
              <p className="text-sm text-muted-foreground">Our AI creates a personalized script. Record it in your own voice, then play it back to guide yourself through reprocessing.</p>
            </div>
            <div className="p-4 border border-border rounded-lg bg-card">
              <div className="flex justify-center mb-4">
                <div className="flex gap-2">
                  <GiProgression className="w-12 h-12 text-primary" />
                </div>
              </div>
              <h3 className="font-semibold mb-2">4. Track Your Progress</h3>
              <p className="text-sm text-muted-foreground">Measure your distress before and after with the SUDs Scale. See your improvement grow with each session as your distress around the target memory is reduced after each treatment.</p>
            </div>
          </div>
        </section>

        {/* --- Pricing / Offer --- */}
         <section className="text-center space-y-4 p-6 border border-primary rounded-lg bg-card shadow-lg"> {/* Removed animation */}
            <h2 className="text-2xl md:text-3xl font-semibold">Start for Free, Then Unlock Lifetime Access for $47</h2>
            <p className="text-md text-muted-foreground">Try Treatment 1 for Free: Experience the power of memory reconsolidation at no cost.</p>
            <p className="text-md text-muted-foreground">Lifetime Access for $47: Get all 5 treatments. No refunds—because we're confident you'll see results.</p>
         </section>

        {/* --- Why Choose Section --- */}
        <section className="space-y-8">
           <h2 className="text-2xl md:text-3xl font-semibold text-center">Why Choose the Reconsolidation Program?</h2>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               <div className="space-y-4">
                   <h3 className="text-xl font-semibold text-primary">Proven Science, Real Results</h3>
                   <ul className="space-y-2 list-disc list-inside text-muted-foreground">
                       <li>RTM-Backed: Based on the protocol with a 90% success rate in clinical studies.</li>
                       <li>Measurable Progress: Track your distress with SUDs—often 40–50% reduction after one treatment.</li>
                       <li>There is no other software application created specifically to target a problem memory, guide the user through the reconsolidation process and rewrite that problem memory for good!</li>
                   </ul>
               </div>
               <div className="space-y-4">
                   <h3 className="text-xl font-semibold text-primary">Simple, Focused, Effective</h3>
                    <ul className="space-y-2 list-disc list-inside text-muted-foreground">
                       <li>No Distractions: Minimalist, narrative-driven experience.</li>
                       <li>Self-Guided Relief: Reprocess at your own pace from the comfort of home.</li>
                       <li>Progress Dashboard: See your journey tracking significant units of distress (SUDs) and completed treatments.</li>
                       <li>Easy to follow step by step guidance through the 6 phase treatment to help you rewrite, reduce, and erase emotional triggers of the past.</li>
                   </ul>
               </div>
           </div>
        </section>


         {/* --- Testimonials --- */}
         <section className="space-y-6">
           <h2 className="text-2xl md:text-3xl font-semibold text-center">What Users Are Saying</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <blockquote className="p-4 border border-border rounded-lg bg-card italic">
                    <p className="mb-2">"After my breakup, I couldn't stop replaying memories of the rejection. The Reconsolidation program helped me reduce my distress by 37% in just one session. I feel lighter already!"</p>
                    <footer className="text-sm text-primary not-italic"> – Sarah, 29</footer>
                </blockquote>
                 <blockquote className="p-4 border border-border rounded-lg bg-card italic">
                    <p className="mb-2">"I was skeptical, but the free treatment showed me real progress. My SUDs dropped from 80 to 45. The $47 was worth every penny for the full program."</p>
                    <footer className="text-sm text-primary not-italic"> – Michael, 34</footer>
                </blockquote>
            </div>
         </section>

        {/* --- Email Capture Form Section --- */}
        <section id="email-form" className="text-center space-y-4 p-6 border border-primary rounded-lg bg-card shadow-lg">
          <h2 className="text-2xl md:text-3xl font-semibold">Start Rewriting a Past Memory Today</h2>
          <p className="text-muted-foreground">
            You don't have to keep living with the weight of a painful memory. Try Treatment 1 for Free. <br/>
            Enter your email to get instant access — no commitment required.
          </p>
          <form onSubmit={handleFormSubmit} className="max-w-md mx-auto space-y-4">
            <Input
              type="email"
              placeholder="Enter your email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isLoading}
              className="text-center"
            />

            {/* Checkboxes */}
             <div className="space-y-2 text-sm text-left">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="privacy"
                    checked={agreedPrivacy}
                    onChange={(e) => setAgreedPrivacy(e.target.checked)}
                    disabled={isLoading}
                    className="h-4 w-4 rounded border-border text-primary focus:ring-primary accent-primary"
                  />
                  <label htmlFor="privacy" className="text-muted-foreground leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    I agree to the <Link to="/privacy-policy" className="text-primary hover:underline">Privacy Policy</Link>
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="terms"
                    checked={agreedTerms}
                    onChange={(e) => setAgreedTerms(e.target.checked)}
                    disabled={isLoading}
                     className="h-4 w-4 rounded border-border text-primary focus:ring-primary accent-primary"
                  />
                  <label htmlFor="terms" className="text-muted-foreground leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    I agree to the <Link to="/terms-conditions" className="text-primary hover:underline">Terms & Conditions</Link>
                  </label>
                </div>
             </div>

             {/* Add reCAPTCHA Widget here if implemented */}
             {/* <div className="flex justify-center my-4"> <ReCAPTCHA ... /> </div> */}

            <Button type="submit" size="lg" disabled={isLoading || !agreedPrivacy || !agreedTerms /* || !recaptchaToken */}>
              {isLoading ? 'Sending...' : 'Start Now'}
            </Button>
          </form>
          {message && (
            <p className={`mt-4 text-sm ${message.startsWith('Success') ? 'text-green-500' : 'text-red-500'}`}>
              {message}
            </p>
          )}
        </section>

        {/* --- Footer --- */}
        <footer className="text-center text-sm text-muted-foreground py-6 space-x-4 border-t border-border">
          <Link to="/privacy-policy" className="hover:text-primary">Privacy Policy</Link>
          <Link to="/terms-conditions" className="hover:text-primary">Terms & Conditions</Link>
           <Link to="/faq" className="hover:text-primary">FAQ</Link>
        </footer>

      </div> {/* End max-w-4xl */}
    </div> // End container div
  );
};

export default LandingPage;