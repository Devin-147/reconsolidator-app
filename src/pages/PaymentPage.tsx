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
    StripeElementsOptions,
    Appearance
} from '@stripe/stripe-js';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from "sonner";

// --- Load Stripe ---
// Ensure VITE_STRIPE_PUBLISHABLE_KEY is set in Vercel Env Vars and .env.local
const stripePublishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;

// Check if the key exists and log an error if not. Provide a fallback TEST key.
if (!stripePublishableKey) {
    console.error("ERROR: VITE_STRIPE_PUBLISHABLE_KEY environment variable is not set. Using fallback test key.");
    // Consider throwing an error or rendering an error state if the key is truly required
}

// Initialize stripePromise ONCE using the variable or fallback
const stripePromise = loadStripe(stripePublishableKey || 'pk_test_YOUR_FALLBACK_TEST_KEY'); // Replace with a valid fallback if needed


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
      redirect: 'if_required' // Handle redirect manually
    });

    if (error) {
      console.error("Stripe Payment Confirmation Error:", error);
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

                // Update Auth State
                console.log("Updating auth state to 'paid'.");
                if (userEmail) {
                    setUserEmailAndStatus(userEmail, 'paid');
                    localStorage.setItem('reconsolidator_paid_access', 'true');
                    localStorage.removeItem('reconsolidator_access_granted');
                } else {
                    console.warn("Cannot update auth status optimistically: userEmail not found.");
                    // Attempt to use email from Payment Intent if available
                    const emailFromStripe = paymentIntent.receipt_email;
                    if (emailFromStripe) {
                        console.log(`Using email from Stripe receipt: ${emailFromStripe}`);
                        setUserEmailAndStatus(emailFromStripe, 'paid');
                        // Maybe store this email in localStorage if needed?
                        // localStorage.setItem('reconsolidator_user_email', emailFromStripe);
                        localStorage.setItem('reconsolidator_paid_access', 'true');
                        localStorage.removeItem('reconsolidator_access_granted');
                    }
                }
                // Trigger background check to verify with backend/webhook update
                checkAuthStatus();
                // End Update Auth State

                // Redirect after success
                setTimeout(() => {
                    navigate('/start');
                }, 1500);
                break;

            case 'processing':
                setMessage("Payment processing. We'll update you when payment is received.");
                setIsLoading(false);
                break;

            case 'requires_payment_method':
                setMessage("Payment failed. Please check your details or try another payment method.");
                setIsLoading(false);
                break;

            default:
                setMessage("Something went wrong with the payment.");
                setIsLoading(false);
                break;
        }
    } else {
         setMessage("Something went wrong, payment status unclear.");
         setIsLoading(false);
    }
  };

  const paymentElementOptions: StripePaymentElementOptions = {
    layout: "tabs"
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
        className="w-full mt-2"
        size="lg"
        type="submit"
      >
        <span id="button-text">
          {isLoading ? "Processing..." : "Pay $47 Now"}
        </span>
      </Button>

      {message && <div id="payment-message" className={`mt-4 text-sm text-center ${message.includes('successful') ? 'text-green-400' : 'text-red-400'}`}>{message}</div>}
    </form>
  );
}


// --- PaymentPage Component (Main Export) ---
const PaymentPage = () => {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const location = useLocation();
  const { userEmail } = useAuth();

  const sudsResult = location.state?.sudsReduction as number | undefined;

  useEffect(() => {
    setFetchError(null);
    fetch("/api/create-payment-intent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
          amount: 4700,
          currency: 'usd',
          email: userEmail // Pass email for metadata/receipt
       }),
    })
      .then(async (res) => {
          if (!res.ok) {
             const errorData = await res.json().catch(() => ({}));
             throw new Error(errorData?.error || `Failed to fetch Payment Intent: ${res.statusText}`);
          }
          return res.json();
       })
      .then((data) => {
          if (data.clientSecret) {
             setClientSecret(data.clientSecret);
          } else {
              throw new Error("Client Secret not received from server.");
          }
       })
      .catch(error => {
          console.error("Error fetching client secret:", error);
          setFetchError(error.message || "Could not initialize payment form. Please try refreshing.");
          toast.error("Could not initialize payment. Please try refreshing.");
      });
  }, [userEmail]);

  const appearance: Appearance = {
    theme: 'night',
    labels: 'floating',
    variables: {
        colorPrimary: '#8b5cf6',
        colorBackground: '#1a1a2e',
        colorText: '#ffffff',
        colorDanger: '#ef4444',
        fontFamily: 'system-ui, sans-serif',
        spacingUnit: '4px',
        borderRadius: '6px',
    },
    rules: {
        '.Input': {
            borderColor: 'hsl(var(--border))',
             backgroundColor: '#0000004d'
        },
         '.Input:focus': {
            borderColor: 'hsl(var(--primary))',
            boxShadow: '0 0 0 1px hsl(var(--ring))'
         }
    }
  };

  const options: StripeElementsOptions = {
    mode: 'payment',
    amount: 4700,
    currency: 'usd',
    appearance: appearance,
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-6 md:p-10 flex items-center justify-center">
      <div className="w-full max-w-md bg-card p-6 md:p-8 rounded-lg shadow-xl border border-border">
        {fetchError ? (
            <div className="text-center text-red-400">
                <p>Error initializing payment:</p>
                <p className="text-sm">{fetchError}</p>
            </div>
        ) : clientSecret ? (
          <Elements stripe={stripePromise} options={options}>
            <CheckoutForm sudsResult={sudsResult} />
          </Elements>
        ) : (
          <div className="text-center py-10">
             <p className="text-muted-foreground animate-pulse">Initializing Secure Payment...</p>
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