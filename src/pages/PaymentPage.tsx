// src/pages/PaymentPage.tsx
import React, { useState, useEffect } from 'react';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe, Stripe } from '@stripe/stripe-js';
// --- CORRECTED IMPORT ---
import StripeCheckoutForm from '@/components/payment/StripeCheckoutForm'; // Use the new path/name
// --- END CORRECTION ---
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY!);

const PaymentPage = () => {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [isLoadingPayment, setIsLoadingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { userEmail, checkAuthStatus, userStatus, isLoading: isAuthLoading } = useAuth();
  const { initialSuds, finalSuds, sudsReduction } = (location.state || {}) as any; // Simplified state access

  // Fetch Client Secret useEffect remains the same...
  useEffect(() => {
    if (userEmail && (userStatus === 'trial' || userStatus === 'paid')) {
      setIsLoadingPayment(true); setPaymentError(null);
      console.log("PaymentPage: Fetching client secret...");
      fetch('/api/create-payment-intent', { /* ... fetch options ... */ })
      .then(/* ... handle response ... */ async (res) => {
          if (!res.ok) { const { error } = await res.json().catch(()=>({})); throw new Error(error || `API Error: ${res.status}`); }
          return res.json();
      })
      .then((data) => { console.log("PaymentPage: Received client secret:", data.clientSecret); setClientSecret(data.clientSecret); })
      .catch((error) => { console.error("PaymentPage: Error fetching client secret:", error); setPaymentError(error.message); toast.error("Could not initialize payment."); })
      .finally(() => { setIsLoadingPayment(false); });
    } else if (!isAuthLoading && userStatus === 'none'){ /* ... handle no access ... */ }
  }, [userEmail, userStatus, isAuthLoading, navigate, initialSuds, finalSuds]);


  const handlePaymentSuccess = async (paymentIntentId: string) => {
    console.log('Payment successful!', paymentIntentId);
    toast.success("Payment successful! Access upgraded.");
    console.log("Triggering auth status refresh after payment...");
    await checkAuthStatus(); // Refresh auth state
    // Maybe navigate after a short delay?
    // setTimeout(() => navigate('/treatment-2'), 1000);
  };

  const appearance = { theme: 'night' as const, labels: 'floating' as const };

  return (
    <div className="min-h-screen bg-background text-foreground p-6 md:p-8">
      <div className="max-w-md mx-auto">
        <h1 className="text-3xl font-bold text-center mb-6">Unlock Full Access</h1>
        <p className="text-center text-muted-foreground mb-8">Complete your one-time payment of $47 for lifetime access.</p>
        {isLoadingPayment && <div className="text-center p-4">Initializing Payment...</div>}
        {paymentError && <div className="text-center p-4 text-red-500">{paymentError}</div>}

        {clientSecret && stripePromise && ( // Ensure stripePromise is also loaded
          <Elements options={{ clientSecret, appearance }} stripe={stripePromise}>
             {/* --- CORRECTED USAGE --- */}
            <StripeCheckoutForm onSuccessfulCheckout={handlePaymentSuccess} />
             {/* --- END CORRECTION --- */}
          </Elements>
        )}

        <div className="text-center mt-6"><button onClick={() => navigate(-1)} className="text-sm text-muted-foreground hover:text-primary">Go Back</button></div>
      </div>
    </div>
  );
};

export default PaymentPage;