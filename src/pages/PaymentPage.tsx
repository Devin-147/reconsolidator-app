// FILE: src/pages/PaymentPage.tsx

import React, { useState, useEffect, useCallback } from 'react'; // Added useCallback
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import StripeCheckoutForm from '@/components/payment/StripeCheckoutForm';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth, UserAccessLevel } from "@/contexts/AuthContext"; 
import { toast } from "sonner";
import { Button } from "@/components/ui/button"; 
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"; 
import { Label } from "@/components/ui/label"; 

const stripePublishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
let stripePromise: ReturnType<typeof loadStripe> | null = null;
if (stripePublishableKey) {
    stripePromise = loadStripe(stripePublishableKey);
} else {
    console.error("Stripe publishable key missing! Payment functionality will be disabled.");
}

interface TierDetail {
  id: 'standard_lifetime' | 'premium_lifetime';
  name: string; price: number; amountInCents: number; description: string; features: string[];
}
const TIERS: TierDetail[] = [
  {
    id: 'standard_lifetime',
    name: 'Standard Lifetime Access',
    price: 47.00,
    amountInCents: 4700,
    description: 'Full access to all 5 treatments using your own recorded narrations.',
    features: ['All 5 treatment protocols', 'User-recorded narrations', 'Progress tracking', 'Lifetime access'],
  },
  {
    id: 'premium_lifetime',
    name: 'Premium Lifetime Access',
    price: 77.00,
    amountInCents: 7700,
    description: 'All Standard features, PLUS AI-generated voice narrations and animated logo visuals.',
    features: ['All Standard features', 'AI Voice Narrator', 'Animated Logo Visuals', 'Enhanced experience'],
  },
];

const PaymentPage = () => {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [isLoadingClientSecret, setIsLoadingClientSecret] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [selectedTierId, setSelectedTierId] = useState<TierDetail['id']>('premium_lifetime');

  const navigate = useNavigate();
  const location = useLocation();
  const { userEmail, checkAuthStatus, accessLevel, isLoading: isAuthLoading } = useAuth();
  const { initialSuds, finalSuds } = (location.state || {}) as { initialSuds?: number; finalSuds?: number; };

  const fetchClientSecret = useCallback(async (tierId: TierDetail['id']) => {
    if (!stripePublishableKey || !userEmail) return;

    setIsLoadingClientSecret(true); 
    setPaymentError(null);
    
    const tierToPurchase = TIERS.find(t => t.id === tierId);
    if (!tierToPurchase) {
        setPaymentError("Invalid purchase option."); setIsLoadingClientSecret(false); return;
    }
    console.log(`PaymentPage: Fetching client secret for ${userEmail}, Tier: ${tierToPurchase.name}, Amount: ${tierToPurchase.amountInCents}`);
    try {
      const response = await fetch('/api/create-payment-intent', {
        method: 'POST', headers: { 'Content-Type': 'application/json', },
        body: JSON.stringify({ 
          amount: tierToPurchase.amountInCents, currency: 'usd', email: userEmail, 
          name: '', sudsInitial: initialSuds ?? 'N/A', sudsFinal: finalSuds ?? 'N/A',
          purchasedTier: tierToPurchase.id 
        }),
      });
      if (!response.ok) { const eD = await response.json().catch(()=>({})); throw new Error(eD.error || `API Error: ${response.status}`); }
      const data = await response.json();
      if (!data.clientSecret) { throw new Error("Client secret missing."); }
      console.log("PaymentPage: Received client secret."); setClientSecret(data.clientSecret);
    } catch (error: any) { 
      setPaymentError(error.message); toast.error(`Payment Init Failed: ${error.message}`); 
    } finally { setIsLoadingClientSecret(false); }
  // Dependencies for the fetchClientSecret callback itself
  }, [userEmail, initialSuds, finalSuds]); 

  // Effect to fetch client secret when component mounts or selectedTierId changes
  useEffect(() => {
    if (!isAuthLoading && userEmail && selectedTierId && stripePromise) {
      // If clientSecret is already set for the current selectedTierId, don't re-fetch unless tier changes
      // This initial fetch assumes clientSecret is null at first.
      // The handleTierChange will reset clientSecret to trigger refetch on tier change.
      if (!clientSecret && !isLoadingClientSecret) {
        fetchClientSecret(selectedTierId);
      }
    } else if (!isAuthLoading && (accessLevel === 'none' || accessLevel === 'not_found')){ 
        toast.error("User not found or access denied."); navigate('/welcome'); 
    }
  // This effect runs when selectedTierId changes (to fetch new secret) or on initial load.
  }, [selectedTierId, isAuthLoading, userEmail, accessLevel, navigate, fetchClientSecret, clientSecret, isLoadingClientSecret]);


  const handlePaymentSuccess = async (paymentIntentId: string) => {
    console.log('PaymentPage: Payment successful!', paymentIntentId); 
    toast.success("Payment successful! Your access is being updated.");
    await checkAuthStatus(); 
    const tierJustPurchased = TIERS.find(t => t.id === selectedTierId);
    toast.info(`You now have ${tierJustPurchased?.name || 'updated'} access!`);
    navigate('/treatment-1'); 
  };

  const handleTierChange = (value: TierDetail['id']) => {
    console.log("PaymentPage: Tier selected:", value);
    setSelectedTierId(value);
    setClientSecret(null); // Reset client secret to force re-fetch in useEffect
    setPaymentError(null); 
  };

  const appearance = { theme: 'night' as const, labels: 'floating' as const };
  const options = clientSecret ? { clientSecret, appearance } : undefined;
  const selectedTierDetails = TIERS.find(t => t.id === selectedTierId);

  if (!stripePromise) {
    return ( <div className="min-h-screen flex items-center justify-center"><div className="text-center text-red-500"><h1 className="text-2xl">Payment System Error</h1><p>Unavailable. Contact support.</p><Button onClick={() => navigate(-1)} className="mt-6">Go Back</Button></div></div> );
  }

  return (
    <div className="min-h-screen bg-background text-foreground p-4 py-8 md:p-6 md:py-12">
      <div className="max-w-lg mx-auto space-y-8">
        <div className="text-center">
            <h1 className="text-3xl md:text-4xl font-bold text-primary">Unlock Full Access</h1>
            <p className="text-muted-foreground mt-2">Choose your lifetime access plan.</p>
        </div>
        <RadioGroup value={selectedTierId} onValueChange={handleTierChange} className="space-y-4">
          {TIERS.map((tier) => (
            <Label 
              key={tier.id} htmlFor={tier.id}
              className={`flex flex-col md:flex-row items-start p-4 md:p-6 border-2 rounded-lg cursor-pointer transition-all ${selectedTierId === tier.id ? 'border-primary ring-2 ring-primary shadow-lg' : 'border-border hover:border-primary/70'}`}
            >
              <RadioGroupItem value={tier.id} id={tier.id} className="mr-4 mt-1 md:mr-6 flex-shrink-0" />
              <div className="flex-grow">
                <span className="block text-xl font-semibold text-card-foreground">{tier.name} - ${tier.price.toFixed(2)}</span>
                <span className="block text-sm text-muted-foreground mt-1 mb-2">{tier.description}</span>
                <ul className="list-disc list-inside space-y-1 text-xs text-muted-foreground">
                    {tier.features.map((feature, i) => <li key={i}>{feature}</li>)}
                </ul>
              </div>
            </Label>
          ))}
        </RadioGroup>
        
        {isAuthLoading && <div className="text-center p-4">Loading User Info...</div>}
        {isLoadingClientSecret && <div className="text-center p-4 text-primary animate-pulse">Initializing Secure Payment...</div>}
        {paymentError && <div className="text-center p-4 text-red-500 bg-red-900/20 rounded-md">{paymentError}</div>}

        {clientSecret && options && selectedTierDetails && !isLoadingClientSecret && !paymentError && (
          <div className="p-6 bg-card rounded-lg border border-border shadow-xl mt-6">
            <Elements options={options} stripe={stripePromise}>
              <StripeCheckoutForm 
                onSuccessfulCheckout={handlePaymentSuccess} 
                selectedTierAmountInCents={selectedTierDetails.amountInCents}
              />
            </Elements>
          </div>
        )}
        <div className="text-center mt-8"> <Button variant="link" size="sm" onClick={() => navigate(-1)} className="text-muted-foreground hover:text-primary"> Maybe Later </Button> </div>
      </div>
    </div>
  );
};
export default PaymentPage;