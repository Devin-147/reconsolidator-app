// FILE: src/pages/PaymentPage.tsx
// Displays upgrade path for standard users, and standard choices for trial users.

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from "@/contexts/AuthContext"; 
import { toast } from "sonner";
import { Button } from "@/components/ui/button"; 
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"; 
import { Label } from "@/components/ui/label"; 
import { Loader2, Zap, ArrowRight, Award } from 'lucide-react';

const TIERS = [
  { id: 'standard_lifetime', priceId: 'price_1R4vocGlRHehBfcVWr0xTMI1', name: 'Standard Lifetime', price: '$47.00', description: 'Full access to all 5 treatments using your own recorded voice.', features: ['All 5 treatment protocols', 'User-recorded narrations', 'Progress tracking', 'Lifetime access'] },
  { id: 'premium_lifetime', priceId: 'price_1RXmGLGlRHehBfcVIjMA7Vu4', name: 'Premium AI Lifetime', price: '$77.00', description: 'All features, PLUS AI-generated narrations and animated visuals.', features: ['All Standard features', 'AI Voice Narrator', 'Animated Logo Visuals', 'Enhanced experience'] },
];

// The specific coupon for upgrading from Standard to Premium
const UPGRADE_COUPON_ID = 'XcUpEyak';

const PaymentPage = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTierId, setSelectedTierId] = useState<string>(TIERS[1].priceId);
  const navigate = useNavigate();
  const { userEmail, accessLevel, isLoading: isAuthLoading } = useAuth();

  const createCheckoutSession = async (priceId: string, couponId?: string) => {
    setIsLoading(true);
    if (isAuthLoading || !userEmail) {
      toast.error("User information not available. Please try again.");
      setIsLoading(false); return;
    }
    try {
      const body = couponId ? { priceId, userEmail, couponId } : { priceId, userEmail };
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await response.json();
      if (response.ok && data.url) {
        window.location.href = data.url; // Redirect to Stripe Checkout
      } else { throw new Error(data.error || 'Failed to create checkout session.'); }
    } catch (error: any) {
      toast.error(error.message); setIsLoading(false);
    }
  };
  
  const renderForStandardUser = () => (
    <div className="text-center p-6 bg-card border-2 border-primary rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold text-primary">Upgrade to Premium</h2>
        <p className="mt-2 text-muted-foreground">You already have Standard Lifetime access. Unlock the full experience with AI narration and animated visuals.</p>
        <div className="my-6 text-left p-4 bg-muted/50 rounded-lg">
            <p className="font-semibold text-lg">Premium Features:</p>
            <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
                <li><Zap className="inline w-4 h-4 mr-2 text-primary" />AI-Generated Voice Narrations</li>
                <li><Award className="inline w-4 h-4 mr-2 text-primary" />Unique Animated Logo for each Narrative</li>
            </ul>
        </div>
        <p className="text-xl font-semibold">Upgrade Price: <span className="line-through text-muted-foreground/80">$77.00</span> $30.00</p>
        <Button size="lg" className="w-full mt-6" disabled={isLoading || isAuthLoading} onClick={() => createCheckoutSession(TIERS[1].priceId, UPGRADE_COUPON_ID)}>
            {isLoading ? <Loader2 className="animate-spin"/> : "Upgrade Now for $30"}
        </Button>
    </div>
  );

  const renderForTrialUser = () => (
    <form onSubmit={(e) => { e.preventDefault(); createCheckoutSession(selectedTierId); }}>
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
  );

  return (
    <div className="min-h-screen p-4 py-8">
      <div className="max-w-lg mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-primary">Unlock Full Access</h1>
          <p className="mt-2 text-muted-foreground">
            {accessLevel === 'standard_lifetime' ? 'Thank you for being a member! Complete your journey.' : 'Choose your lifetime access plan.'}
          </p>
        </div>
        
        {isAuthLoading && <div className="text-center p-4"><Loader2 className="animate-spin" /></div>}
        
        {!isAuthLoading && accessLevel === 'standard_lifetime' && renderForStandardUser()}
        {!isAuthLoading && accessLevel === 'trial' && renderForTrialUser()}

        <div className="text-center mt-4"> <Button variant="link" size="sm" onClick={() => navigate(-1)}>Maybe Later</Button> </div>
      </div>
    </div>
  );
};
export default PaymentPage;