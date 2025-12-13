// FILE: src/pages/PaymentPage.tsx
// FINAL CORRECTED VERSION

import React, { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { NeuralSpinner } from '@/components/ui/NeuralSpinner';
import { CheckCircle } from 'lucide-react';

const stripePromise = loadStripe(process.env.VITE_STRIPE_PUBLISHABLE_KEY || '');

// IMPORTANT: Replace with your actual Price IDs from your Stripe dashboard
const STANDARD_PRICE_ID = "price_1PPZgYJgJ...your...standard...id";
const PREMIUM_PRICE_ID = "price_1PPZgYJgJ...your...premium...id";

const PlanOption = ({ title, price, description, isSelected, onSelect }: { title: string, price: string, description: string, isSelected: boolean, onSelect: () => void }) => (
  <div
    className={`relative p-6 border-2 rounded-lg cursor-pointer transition-all ${isSelected ? 'border-primary bg-primary/10 ring-2 ring-primary' : 'border-border hover:border-primary/50'}`}
    onClick={onSelect}
  >
    {isSelected && (
      <div className="absolute top-4 right-4">
        <CheckCircle className="w-6 h-6 text-primary" />
      </div>
    )}
    <h2 className="text-2xl font-semibold">{title} - ${price}</h2>
    <p className="text-muted-foreground mt-1">{description}</p>
  </div>
);

const PaymentPage = () => {
  const [selectedPlan, setSelectedPlan] = useState<'standard' | 'premium'>('premium');
  const [isLoading, setIsLoading] = useState(false);
  const { userEmail } = useAuth();

  const handleCheckout = async () => {
    if (!userEmail) {
      toast.error("Could not identify user. Please log in again.");
      return;
    }
    setIsLoading(true);

    const priceId = selectedPlan === 'premium' ? PREMIUM_PRICE_ID : STANDARD_PRICE_ID;

    try {
      const response = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'createCheckout',
          payload: { priceId, userEmail }
        }),
      });

      const { sessionId, error } = await response.json();
      if (error) throw new Error(error);

      const stripe = await stripePromise;
      if (!stripe) throw new Error("Stripe.js has not loaded yet.");

      const { error: stripeError } = await stripe.redirectToCheckout({ sessionId });
      if (stripeError) throw new Error(stripeError.message);

    } catch (error: any) {
      toast.error("Payment failed", { description: error.message });
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-white p-4">
      <div className="w-full max-w-2xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-2 text-primary">Unlock Your Full Potential</h1>
        <p className="text-center text-muted-foreground mb-8">Choose the plan that's right for you. Your first treatment is free.</p>

        <div className="space-y-4 mb-8">
          <PlanOption
            title="Standard Lifetime"
            price="47.00"
            description="Full access to all 5 treatments using your own recorded voice."
            isSelected={selectedPlan === 'standard'}
            onSelect={() => setSelectedPlan('standard')}
          />
          <PlanOption
            title="Premium AI Lifetime"
            price="77.00"
            description="All features, PLUS AI-generated narrations and animated visuals."
            isSelected={selectedPlan === 'premium'}
            onSelect={() => setSelectedPlan('premium')}
          />
        </div>

        <Button 
          onClick={handleCheckout} 
          disabled={isLoading} 
          className="w-full h-14 text-lg font-bold"
          size="lg"
        >
          {isLoading ? <NeuralSpinner /> : `Proceed to Payment for ${selectedPlan === 'premium' ? '$77.00' : '$47.00'}`}
        </Button>
        <Button variant="link" className="w-full mt-2 text-muted-foreground">Maybe Later</Button>
      </div>
    </div>
  );
};

export default PaymentPage;
