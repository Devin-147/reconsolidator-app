// src/pages/LandingPage.tsx
import React, { useState } from 'react'; // Import React
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext'; // <<<--- Import useAuth

// import { Checkbox } from "@/components/ui/checkbox"; // Import if using shadcn Checkbox
// import { Label } from "@/components/ui/label"; // Import if using shadcn Label

const LandingPage = () => {
  const [email, setEmail] = useState('');
  const [agreedPrivacy, setAgreedPrivacy] = useState(false);
  const [agreedTerms, setAgreedTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const navigate = useNavigate();
  const { setUserEmailAndStatus } = useAuth(); // <<<--- Get function from useAuth hook

  const handleFormSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage('');

    // Checkboxes Validation
    if (!agreedPrivacy || !agreedTerms) {
      setMessage('Please agree to the Privacy Policy and Terms & Conditions.');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/request-access', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        // --- START: Updated Success Logic ---
        setMessage('Success! Check your email. Redirecting you to start...');

        // 1. Update Auth Context (sets email, status 'trial', updates localStorage)
        setUserEmailAndStatus(email, 'trial');

        // 2. Reset local form state (optional for email, good for checkboxes)
        // setEmail(''); // Keep email maybe?
        setAgreedPrivacy(false);
        setAgreedTerms(false);

        // 3. Redirect after delay
        setTimeout(() => {
          navigate('/treatment-1'); // Redirect to app entry point
        }, 1500);
        // --- END: Updated Success Logic ---

      } else {
        setMessage(data.error || 'An error occurred. Please try again.');
        setIsLoading(false); // <<<--- Make sure loading stops on error
      }
    } catch (error) {
      console.error('Request Access API call failed:', error);
      setMessage('An error occurred. Please check your connection and try again.');
      setIsLoading(false); // <<<--- Make sure loading stops on catch
    }
    // Removed finally block as loading state is handled within try/catch/success path
  };

  // Function to handle direct payment (optional, could redirect to a payment page)
  const handleDirectPay = () => {
    console.log('Trigger direct payment flow...');
    alert('Direct payment flow not implemented yet.');
  };


  return (
    <div className="min-h-screen bg-background text-foreground p-6 md:p-10">
      <div className="max-w-4xl mx-auto space-y-16 md:space-y-24">

        {/* --- Hero Section --- */}
        <section className="text-center space-y-4 pt-10">
          <h1 className="text-4xl md:text-5xl font-bold text-primary tracking-tight">
            The Reconsolidation Program: Target a Memory to Rewrite and Find Lasting Relief
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            Let go of the past with proven RTM techniques—start with a free treatment and experience the difference for yourself.
          </p>
          <Button size="lg" onClick={() => document.getElementById('email-form')?.scrollIntoView({ behavior: 'smooth' })}>
             Try Treatment 1 Free
          </Button>
        </section>

        {/* --- Pain Point / Benefit --- */}
        <section className="text-center space-y-3">
            <h2 className="text-2xl md:text-3xl font-semibold">Heal from an Emotional Memory in Just 5 Guided Treatments</h2>
            <p className="text-md text-muted-foreground max-w-3xl mx-auto">
              Struggling with memories that won’t let go—like a painful breakup, a lingering rejection, or a moment of shame? The Reconsolidation program uses the science-backed Reconsolidation of Traumatic Memories (RTM) protocol to help you reprocess those memories and reduce their emotional impact. In studies, 90% of users saw significant relief from intrusive symptoms, and one user reduced their distress by 76% in a single session. You can too.
            </p>
        </section>

        {/* --- How It Works --- */}
        <section className="space-y-8">
          <h2 className="text-2xl md:text-3xl font-semibold text-center">How the Reconsolidation Program Works</h2>
          <p className="text-center text-muted-foreground">
            The program guides you through a simple, narrative-driven process to reprocess painful memories in your mind—no distractions, just results. Here’s how:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 text-center">
            <div className="p-4 border border-border rounded-lg bg-card">
              <h3 className="font-semibold mb-2">1. Narrate Your Memory</h3>
              <p className="text-sm text-muted-foreground">Answer a few questions to personalize your experience: What emotion do you feel? How intense is the memory? We’ll tailor the process to you.</p>
            </div>
             <div className="p-4 border border-border rounded-lg bg-card">
              <h3 className="font-semibold mb-2">2. Choose Mismatch Experiences</h3>
              <p className="text-sm text-muted-foreground">Select 11 novel experiences to disrupt the memory’s emotional hold, making it easier to rewrite.</p>
            </div>
             <div className="p-4 border border-border rounded-lg bg-card">
              <h3 className="font-semibold mb-2">3. Follow the Guided Narrative</h3>
              <p className="text-sm text-muted-foreground">Our AI creates a personalized script. Record it in your own voice, then play it back to guide yourself through reprocessing.</p>
            </div>
             <div className="p-4 border border-border rounded-lg bg-card">
              <h3 className="font-semibold mb-2">4. Track Your Progress</h3>
              <p className="text-sm text-muted-foreground">Measure your distress before and after with the SUDs Scale. See your improvement grow with each session.</p>
            </div>
          </div>
        </section>

        {/* --- Pricing / Offer --- */}
         <section className="text-center space-y-4 p-6 border border-primary rounded-lg bg-card shadow-lg">
            <h2 className="text-2xl md:text-3xl font-semibold">Start for Free, Then Unlock Lifetime Access for $47</h2>
            <p className="text-md text-muted-foreground">Try Treatment 1 for Free: Experience the power of memory reconsolidation at no cost.</p>
            <p className="text-md text-muted-foreground">Lifetime Access for $47: Get all 5 treatments. No refunds—because we’re confident you’ll see results.</p>
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
                       <li>There is nothing else like this. An application built on targeting an event and using the reconsolidation process for modifying a problem memory for good!</li>
                   </ul>
               </div>
               <div className="space-y-4">
                   <h3 className="text-xl font-semibold text-primary">Simple, Focused, Effective</h3>
                    <ul className="space-y-2 list-disc list-inside text-muted-foreground">
                       <li>No Distractions: Minimalist, narrative-driven experience.</li>
                       <li>Self-Guided Relief: Reprocess at your own pace, where you feel safe.</li>
                       <li>Progress Dashboard: See your journey tracking SUDs and completed treatments.</li>
                   </ul>
               </div>
           </div>
        </section>


         {/* --- Testimonials --- */}
         <section className="space-y-6">
           <h2 className="text-2xl md:text-3xl font-semibold text-center">What Users Are Saying</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <blockquote className="p-4 border border-border rounded-lg bg-card italic">
                    <p className="mb-2">“After my breakup, I couldn’t stop replaying memories of the rejection. THe Reconsolidation program helped me reduce my distress by 50% in just one session. I feel lighter already!”</p>
                    <footer className="text-sm text-primary not-italic"> – Sarah, 29</footer>
                </blockquote>
                 <blockquote className="p-4 border border-border rounded-lg bg-card italic">
                    <p className="mb-2">“I was skeptical, but the free treatment showed me real progress. My SUDs dropped from 80 to 45. The $47 was worth every penny for the full program.”</p>
                    <footer className="text-sm text-primary not-italic"> – Michael, 34</footer>
                </blockquote>
            </div>
         </section>

        {/* --- Email Capture Form Section --- */}
        <section id="email-form" className="text-center space-y-4 p-6 border border-primary rounded-lg bg-card shadow-lg">
          <h2 className="text-2xl md:text-3xl font-semibold">Start Rewriting a Past Memory Today</h2>
          <p className="text-muted-foreground">
            You don’t have to keep living with the weight of a painful memory. Try Treatment 1 for Free. <br/>
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
                    className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
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
                     className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                  />
                  <label htmlFor="terms" className="text-muted-foreground leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    I agree to the <Link to="/terms-conditions" className="text-primary hover:underline">Terms & Conditions</Link>
                  </label>
                </div>
             </div>

            <Button type="submit" size="lg" disabled={isLoading || !agreedPrivacy || !agreedTerms}>
              {isLoading ? 'Sending...' : 'Start Now'}
            </Button>
          </form>
          {/* Message Area */}
          {message && (
            <p className={`mt-4 text-sm ${message.startsWith('Success') ? 'text-green-500' : 'text-red-500'}`}>
              {message}
            </p>
          )}
        </section>

        {/* Removed Optional Direct Purchase Section */}

        {/* --- Footer --- */}
        <footer className="text-center text-sm text-muted-foreground py-6 space-x-4 border-t border-border">
          <Link to="/privacy-policy" className="hover:text-primary">Privacy Policy</Link>
          <Link to="/terms-conditions" className="hover:text-primary">Terms & Conditions</Link>
           <Link to="/faq" className="hover:text-primary">FAQ</Link>
           {/* Add contact info/link if desired */}
        </footer>

      </div> {/* End max-w-4xl */}
    </div> // End container div
  );
};

export default LandingPage;