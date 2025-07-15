// FILE: src/pages/PaymentPage.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from "@/contexts/AuthContext"; 
import { toast } from "sonner";
import { Button } from "@/components/ui/button"; 
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"; 
import { Label } from "@/components/ui/label"; 
import { Loader2 } from 'lucide-react';

const TIERS = [
  { id: 'standard_lifetime', priceId: 'price_1R4vocGlRHehBfcVWr0xTMI1', name: 'Standard Lifetime', price: '$47.00', description: 'Full access to all 5 treatments using your own recorded voice.' },
  { id: 'premium_lifetime', priceId: 'price_1RXmGLGlRHehBfcVIjMA7Vu4', name: 'Premium AI Lifetime', price: '$77.00', description: 'All features, PLUS AI-generated narrations and animated visuals.' },
];

const PaymentPage = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTierId, setSelectedTierId] = useState<string>(TIERS[1].priceId);
  const navigate = useNavigate();
  const { userEmail, isLoading: isAuthLoading } = useAuth();

  const handleFormSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    if (isAuthLoading || !userEmail) {
      toast.error("User information not available. Please try again.");
      setIsLoading(false); return;
    }
    try {
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId: selectedTierId, userEmail: userEmail }),
      });
      const data = await response.json();
      if (response.ok && data.url) {
        window.location.href = data.url; // Redirect to Stripe Checkout
      } else { throw new Error(data.error || 'Failed to create checkout session.'); }
    } catch (error: any) {
      toast.error(error.message); setIsLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen p-4 py-8">
      <div className="max-w-lg mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-primary">Unlock Full Access</h1>
          <p className="mt-2">Choose your lifetime access plan.</p>
        </div>
        <form onSubmit={handleFormSubmit}>
          <RadioGroup value={selectedTierId} onValueChange={setSelectedTierId} className="space-y-4">
            {TIERS.map((tier) => (
              <Label key={tier.id} htmlFor={tier.priceId} className={`flex p-4 border-2 rounded-lg cursor-pointer transition-all ${selectedTierId === tier.priceId ? 'border-primary ring-2 ring-primary' : 'border-border'}`}>
                <RadioGroupItem value={tier.priceId} id={tier.priceId} className="mr-4 mt-1" />
                <div className="flex-grow">
                  <span className="block text-xl font-semibold">{tier.name} - {tier.price}</span>
                  <span className="block text-sm text-muted-foreground mt-1">{tier.description}</span>
                </div>
              </Label>
            ))}
          </RadioGroup>
          <Button type="submit" size="lg" className="w-full mt-8" disabled={isLoading || isAuthLoading}>
            {isLoading ? <Loader2 className="animate-spin" /> : `Proceed to Payment`}
          </Button>
        </form>
        <div className="text-center mt-4"> <Button variant="link" size="sm" onClick={() => navigate(-1)}>Maybe Later</Button> </div>
      </div>
    </div>
  );
};
export default PaymentPage;