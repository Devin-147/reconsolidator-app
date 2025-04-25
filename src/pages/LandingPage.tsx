// src/pages/LandingPage.tsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { MdOutlineEmergencyRecording } from "react-icons/md";
import { RxMix } from "react-icons/rx";
import { GrCatalog } from "react-icons/gr";
import { GiProgression } from "react-icons/gi";

const LandingPage = () => {
  const [email, setEmail] = useState('');
  const [agreedPrivacy, setAgreedPrivacy] = useState(false);
  const [agreedTerms, setAgreedTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const navigate = useNavigate();
  const { checkAuthStatus } = useAuth(); // Get checkAuthStatus

  const handleFormSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage('');
    if (!agreedPrivacy || !agreedTerms) {
      setMessage('Please agree to the Privacy Policy and Terms & Conditions.'); return;
    }
    setIsLoading(true);

    try {
      const response = await fetch('/api/request-access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      let data: { error?: string; message?: string } = {};
      try { data = await response.json(); } catch (e) {
        console.warn("Could not parse JSON from /api/request-access");
        if (!response.ok) data = { error: `Request failed: ${response.status}` };
      }

      if (response.ok) {
        console.log(`LandingPage: API success for ${email}. Storing email, preparing redirect.`);
        // Store email so Index page can trigger auth check
        try { localStorage.setItem('reconsolidator_user_email', email); } catch {}
        setAgreedPrivacy(false); setAgreedTerms(false);
        setMessage(data.message || 'Success! Redirecting to setup...'); // API should send "Success: ..."
        // Don't call checkAuthStatus here, let Index page handle it after navigation
        setTimeout(() => {
          console.log("LandingPage: Navigating to / (Memory Recording Setup)");
          navigate('/'); // Redirect to setup page '/'
        }, 500); // Short delay for message visibility
      } else {
        setMessage(data.error || `Request failed: ${response.status}.`);
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Request Access API call failed:', error);
      setMessage('An error occurred. Check connection.');
      setIsLoading(false);
    }
  };

  // --- Full Landing Page JSX ---
  return (
    <div className="min-h-screen bg-background text-foreground p-6 md:p-6">
      <div className="max-w-4xl mx-auto space-y-16 md:space-y-24">
        {/* --- Hero Section --- */}
        <section className="text-center space-y-4 pt-10">
          <div className="flex justify-center mb-4">
            <img src="/images/logo.png" alt="Reconsolidator Logo" width="150" height="auto" />
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-white tracking-tight">
            Reconsolidation Program
          </h1>
          <h2 className="text-3xl md:text-4xl font-semibold tracking-tight pt-2" style={{ color: '#7DFDFE' }}>
            Target a Bad Memory <br></br>and Rewrite it for Good
          </h2>
        </section>
        {/* --- Description Section --- */}
        <section className="flex flex-col items-center justify-between h-64">
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto pt-0">
            Let go of the past with proven Reconsolidation techniques—start with a free treatment and experience the difference for yourself.
          </p>
          <Button size="lg" className="mt-4 mb-4" onClick={() => document.getElementById('email-form')?.scrollIntoView({ behavior: 'smooth' })}>
            Try Treatment 1 Free
          </Button>
          <h2 className="text-2xl md:text-3xl font-semibold text-center">Brainwash an Emotional Memory <br></br>in 5 Treatments (or less)</h2>
        </section>
        {/* --- Pain Point / Benefit --- */}
        <section className="text-center space-y-3">
            <p className="text-md text-muted-foreground max-w-3xl mx-auto">
              Are you struggling with memories that won't let go—maybe a painful breakup, a lingering rejection, or an eventful moment of guilt, anger, sadness or shame? The Reconsolidation program uses the science-backed Reconsolidation of Traumatic Memories (RTM) protocol to help you reprocess those memories and reduce their emotional impact. In studies, 90% of users saw significant relief from intrusive symptoms, and one user reduced their distress by 76% in a single session. You can too.
            </p>
        </section>

        {/* --- How It Works --- */}
        <section className="space-y-8">
          <h2 className="text-2xl md:text-3xl font-semibold text-center">How the Reconsolidation Program Works</h2>
          <p className="text-center text-muted-foreground">
            The program guides you through a simple, narrative-driven process to reprocess one specific memory to target in your mind—no distractions, just results. Here's how:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 text-center">
            {/* Step 1 */}
            <div className="p-4 border border-border rounded-lg bg-card">
              <div className="flex justify-center mb-4"><MdOutlineEmergencyRecording className="w-12 h-12 text-primary" /></div>
              <h3 className="font-semibold mb-2">1. Narrate Your Memory</h3>
              <p className="text-sm text-muted-foreground">Decide which eventful memory you want to target for reconsolidation.  Then choose a positive memory before the event and a positive memory after the event. We'll tailor the process to you.</p>
            </div>
            {/* Step 2 */}
            <div className="p-4 border border-border rounded-lg bg-card">
              <div className="flex justify-center mb-4"><RxMix className="w-12 h-12 text-primary" /></div>
              <h3 className="font-semibold mb-2">2. Choose Mismatch Experiences</h3>
              <p className="text-sm text-muted-foreground">Select 11 novel experiences as prediction errors for disrupting the memory's emotional hold, making it malleable for modification.</p>
            </div>
             {/* Step 3 */}
            <div className="p-4 border border-border rounded-lg bg-card">
              <div className="flex justify-center mb-4"><GrCatalog className="w-12 h-12 text-primary" /></div>
              <h3 className="font-semibold mb-2">3. Follow the Guided Narrative</h3>
              <p className="text-sm text-muted-foreground">Our AI creates a personalized script. Record it in your own voice, then play it back to guide yourself through the controlled reprocessing.</p>
            </div>
             {/* Step 4 */}
            <div className="p-4 border border-border rounded-lg bg-card">
              <div className="flex justify-center mb-4"><div className="flex gap-2"><GiProgression className="w-12 h-12 text-primary" /></div></div>
              <h3 className="font-semibold mb-2">4. Track Your Progress</h3>
              <p className="text-sm text-muted-foreground">Measure your distress before and after with the SUDs Scale. See your improvement grow with each session as your distress around the target memory is reduced after each treatment.</p>
            </div>
          </div>
        </section>

        {/* --- Pricing / Offer --- */}
         <section className="text-center space-y-4 p-6 border border-primary rounded-lg bg-card shadow-lg">
            <h2 className="text-2xl md:text-3xl font-semibold">Start for Free, Then Unlock Lifetime Access for $47</h2>
            <p className="text-md text-muted-foreground">Try Treatment 1 for Free: Experience the power of memory reconsolidation at no cost.</p>
            <p className="text-md text-muted-foreground">Lifetime Access for $47: Get all 5 treatments. No refunds—because you can try it for free before buying!</p>
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
                       <li>Easy to follow step by step guidance through a 6 phase treatment process to help you rewrite, reduce, and erase emotional triggers of the past.</li>
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
                    <p className="mb-2">"I was skeptical, but the free treatment showed me real progress. My SUDs dropped from 74 to 45. The $47 was worth every penny for the full program."</p>
                    <footer className="text-sm text-primary not-italic"> – Michael, 34</footer>
                </blockquote>
            </div>
            {/* Warning Box */}
            <div role="alert" className="relative w-full max-w-2xl mx-auto my-6 text-sm rounded-lg border border-[#4d120e] bg-[#4A1212] p-3 text-white">
              <div className="flex items-start">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-5 h-5 text-[#FF4D4D] mr-2">
                  <path fillRule="evenodd" d="M6.701 2.25c.577-1 2.02-1 2.598 0l5.196 9a1.5 1.5 0 0 1-1.299 2.25H2.804a1.5 1.5 0 0 1-1.3-2.25l5.197-9ZM8 4a.75.75 0 0 1 .75.75v3a.75.75 0 1 1-1.5 0v-3A.75.75 0 0 1 8 4Zm0 8a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" clipRule="evenodd" ></path>
                </svg>
                <div className="pl-1">
                  <p className="font-semibold">Please Note:</p>
                  <p className="mt-1">This application guides you through memory reconsolidation, a natural function of the brain. However, this organic process can also risk re-traumatization. Ensure you proceed mindfully.</p>
                </div>
              </div>
            </div>
         </section>

        {/* --- Email Capture Form Section --- */}
        <section id="email-form" className="text-center space-y-4 p-6 border border-primary rounded-lg bg-card shadow-lg">
          <h2 className="text-2xl md:text-3xl font-semibold">Start Rewriting a Past Memory Today</h2>
          <p className="text-muted-foreground">
            You don't have to keep living with the weight of a past memory. Try Treatment 1 for Free. <br/>
            Enter your email to get instant access — no commitment required.
          </p>
          <form onSubmit={handleFormSubmit} className="max-w-md mx-auto space-y-4">
            <Input type="email" placeholder="Enter your email address" value={email} onChange={(e) => setEmail(e.target.value)} required disabled={isLoading} className="text-center"/>
            <div className="space-y-2 text-sm text-left">
                <div className="flex items-center space-x-2"><input type="checkbox" id="privacy" checked={agreedPrivacy} onChange={(e) => setAgreedPrivacy(e.target.checked)} disabled={isLoading} className="h-4 w-4 accent-primary"/><label htmlFor="privacy" className="text-muted-foreground leading-none">I agree to the <Link to="/privacy-policy" className="text-primary hover:underline">Privacy Policy</Link></label></div>
                <div className="flex items-center space-x-2"><input type="checkbox" id="terms" checked={agreedTerms} onChange={(e) => setAgreedTerms(e.target.checked)} disabled={isLoading} className="h-4 w-4 accent-primary"/><label htmlFor="terms" className="text-muted-foreground leading-none">I agree to the <Link to="/terms-conditions" className="text-primary hover:underline">Terms & Conditions</Link></label></div>
             </div>
            <Button type="submit" size="lg" disabled={isLoading || !agreedPrivacy || !agreedTerms}>{isLoading ? 'Sending...' : 'Start Treatment Setup'}</Button>
          </form>
          {message && (<p className={`mt-4 text-sm ${message.startsWith('Success') ? 'text-green-500' : 'text-red-500'}`}>{message}</p>)}
        </section>

        {/* --- Footer --- */}
        <footer className="text-center text-sm text-muted-foreground py-6 space-x-4 border-t border-border">
          <Link to="/privacy-policy" className="hover:text-primary">Privacy</Link>
          <Link to="/terms-conditions" className="hover:text-primary">Terms</Link>
           <Link to="/faq" className="hover:text-primary">FAQ</Link>
        </footer>
      </div>
    </div>
  );
  // --- END FULL JSX ---
};
export default LandingPage;