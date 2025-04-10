// src/pages/PaymentPage.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  PaymentElement,
  Elements,
  useStripe,
  useElements
} from '@stripe/react-stripe-js';
// Import necessary types from stripe-js
import {
    loadStripe,
    StripePaymentElementOptions,
    StripeElementsOptions, // Needed for Elements provider options
    Appearance                 // Needed for explicit appearance typing
} from '@stripe/stripe-js';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from "sonner";

// --- Load Stripe ---
// Ensure NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is set in Vercel Env Vars and .env.local
const stripePublishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
if (!stripePublishableKey) {
    console.error("ERROR: NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY environment variable is not set.");
    // Optionally: Render an error message or throw an error if the key is missing
}
const stripePromise = loadStripe(stripePublishableKey || 'pk_test_...'); // Provide a fallback test key if needed

// --- CheckoutForm Component (Internal) ---
// Renders the actual Payment Element and handles submission
const CheckoutForm = ({ sudsResult }: { sudsResult?: number | null }) => {
  const stripe = useStripe();
  const elements = useElements();
  const navigate = useNavigate();
  const { userEmail, setUserEmailAndStatus, checkAuthStatus } = useAuth();

  const [message, setMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setMessage(null);

    if (!stripe || !elements) {
      console.error("Stripe.js has not loaded yet.");
      setMessage("Payment system initializing, please wait a moment.");
      return;
    }

    setIsLoading(true);

    // Trigger payment confirmation using Payment Element
    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      // Use redirect: 'if_required' to handle results client-side
      redirect: 'if_required'
    });

    if (error) {
      console.error("Stripe Payment Confirmation Error:", error);
      // Check for specific error types if needed (e.g., card_error)
      setMessage(error.message || "An unexpected error occurred during payment.");
      setIsLoading(false);
      return;
    }

    // Handle Payment Intent status after confirmation attempt
    if (paymentIntent) {
        switch (paymentIntent.status) {
            case 'succeeded':
                console.log("Payment Succeeded!", paymentIntent);
                setMessage("Payment successful! Granting access...");
                toast.success("Payment successful! Access granted.");

                // --- Update Auth State ---
                console.log("Updating auth state to 'paid'.");
                if (userEmail) {
                    setUserEmailAndStatus(userEmail, 'paid');
                    localStorage.setItem('reconsolidator_paid_access', 'true');
                    localStorage.removeItem('reconsolidator_access_granted'); // Remove trial flag
                } else {
                    console.warn("Cannot update auth status optimistically: userEmail not found.");
                }
                // Trigger background check to verify with backend/webhook update
                checkAuthStatus();
                // --- End Update Auth State ---

                // Redirect after success
                setTimeout(() => {
                    navigate('/start'); // Redirect to app dashboard/start
                }, 1500);
                break; // Don't setIsLoading(false) as we navigate away

            case 'processing':
                setMessage("Payment processing. We'll update you when payment is received.");
                setIsLoading(false);
                break;

            case 'requires_payment_method':
                 // This case might happen if initial payment failed and needs retry
                setMessage("Payment failed. Please check your details or try another payment method.");
                setIsLoading(false);
                break;

            default:
                setMessage("Something went wrong with the payment.");
                setIsLoading(false);
                break;
        }
    } else {
        // This case should ideally not be reached with redirect: 'if_required' unless there's an edge case
         setMessage("Something went wrong, payment status unclear.");
         setIsLoading(false);
    }
  };

  // Options specific to the Payment Element itself
  const paymentElementOptions: StripePaymentElementOptions = {
    layout: "tabs" // or 'accordion', 'auto'
    // Add other Payment Element options here if needed (e.g., defaultValues)
  };

  return (
    <form id="payment-form" onSubmit={handleSubmit}>
      {sudsResult !== undefined && sudsResult !== null && (
         <p className="mb-4 p-3 bg-green-900/50 border border-green-500/50 rounded text-center text-sm text-green-200">
             Your distress reduced by {sudsResult.toFixed(0)}% in Treatment 1! Unlock the full program to continue your progress.
         </p>
      )}
       <h2 className="text-xl font-semibold mb-4 text-center">Unlock Lifetime Access - $47</h2>

      <PaymentElement id="payment-element" options={paymentElementOptions} className="mb-4" />

      <Button
        disabled={isLoading || !stripe || !elements}
        id="submit"
        className="w-full mt-2" // Reduced margin top slightly
        size="lg"
        type="submit" // Explicitly set type to submit
      >
        <span id="button-text">
          {isLoading ? "Processing..." : "Pay $47 Now"}
        </span>
      </Button>

      {/* Show any error or success messages */}
      {message && <div id="payment-message" className={`mt-4 text-sm text-center ${message.includes('successful') ? 'text-green-400' : 'text-red-400'}`}>{message}</div>}
    </form>
  );
}


// --- PaymentPage Component (Main Export) ---
// Fetches clientSecret and sets up the Elements provider
const PaymentPage = () => {
  const [clientSecret, setClientSecret] = useState<string | null>(null); // Initialize as null
  const [fetchError, setFetchError] = useState<string | null>(null); // State for fetch errors
  const location = useLocation();
  const { userEmail } = useAuth(); // Get email to potentially pass to backend

  // Extract potential SUDs result passed via navigation state
  const sudsResult = location.state?.sudsReduction as number | undefined;

  useEffect(() => {
    setFetchError(null); // Clear previous errors on mount
    // Create PaymentIntent when the component mounts
    fetch("/api/create-payment-intent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      // Send amount in cents. Pass userEmail if available.
      body: JSON.stringify({
          amount: 4700,
          currency: 'usd',
          email: userEmail // Pass email for metadata/receipt
       }),
    })
      .then(async (res) => { // Make async to await res.json() on error
          if (!res.ok) {
             // Try to get error message from backend response body
             const errorData = await res.json().catch(() => ({})); // Catch JSON parse error
             throw new Error(errorData?.error || `Failed to fetch Payment Intent: ${res.statusText}`);
          }
          return res.json();
       })
      .then((data) => {
          if (data.clientSecret) {
             setClientSecret(data.clientSecret);
          } else {
              // This case might happen if the backend returns 200 OK but no clientSecret
              throw new Error("Client Secret not received from server.");
          }
       })
      .catch(error => {
          console.error("Error fetching client secret:", error);
          setFetchError(error.message || "Could not initialize payment form. Please try refreshing.");
          toast.error("Could not initialize payment. Please try refreshing.");
      });
  }, [userEmail]); // Re-fetch if userEmail changes (might not be necessary)

  // Define appearance object with explicit Appearance type
  const appearance: Appearance = {
    theme: 'night', // Use 'night', 'stripe', or 'flat'
    labels: 'floating',
    variables: {
        colorPrimary: '#8b5cf6', // Example: Match your primary color
        colorBackground: '#1a1a2e', // Example: Match your dark background
        colorText: '#ffffff',
        colorDanger: '#ef4444',
        fontFamily: 'system-ui, sans-serif', // Use your actual font stack
        spacingUnit: '4px',
        borderRadius: '6px', // Slightly larger radius example
         // See Stripe docs for more appearance variables
    },
    rules: { // Example rules
        '.Input': {
            borderColor: 'hsl(var(--border))', // Use CSS variable
             backgroundColor: '#0000004d' // Example darker input bg
        },
         '.Input:focus': {
            borderColor: 'hsl(var(--primary))',
            boxShadow: '0 0 0 1px hsl(var(--ring))' // Example focus ring
         }
    }
  };

  // Define options for the Elements provider, using the structure required by Stripe
  const options: StripeElementsOptions = {
    // clientSecret is NOT passed here when using Payment Element mode 'payment'
    mode: 'payment', // Essential for Payment Element with Payment Intent
    amount: 4700,    // Required for mode 'payment'
    currency: 'usd', // Required for mode 'payment'
    appearance: appearance, // Pass the defined appearance object
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-6 md:p-10 flex items-center justify-center">
      <div className="w-full max-w-md bg-card p-6 md:p-8 rounded-lg shadow-xl border border-border">
        {fetchError ? (
            // Display error if clientSecret fetch failed
            <div className="text-center text-red-400">
                <p>Error initializing payment:</p>
                <p className="text-sm">{fetchError}</p>
            </div>
        ) : clientSecret ? (
          // Render Elements provider only when clientSecret is available
          <Elements stripe={stripePromise} options={options}>
            <CheckoutForm sudsResult={sudsResult} />
          </Elements>
        ) : (
          // Show loading state while fetching clientSecret
          <div className="text-center py-10">
             <p className="text-muted-foreground animate-pulse">Initializing Secure Payment...</p>
             {/* Add a spinner component here if desired */}
          </div>
        )}
         <p className="text-xs text-muted-foreground text-center mt-4">
             Payments processed securely by Stripe. All sales are final.
         </p>
      </div>
    </div>
  );
};

export default PaymentPage;