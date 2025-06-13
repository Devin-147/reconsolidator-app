// FILE: src/components/payment/StripeCheckoutForm.tsx

import React, { useState, useEffect } from 'react';
import {
  PaymentElement,
  useStripe,
  useElements
} from "@stripe/react-stripe-js";
import { Button } from "@/components/ui/button"; 
import { toast } from "sonner"; 
import { Loader2 } from 'lucide-react'; // For loading spinner

interface StripeCheckoutFormProps {
  onSuccessfulCheckout: (paymentIntentId: string) => void;
  // New prop to display the correct amount on the button
  selectedTierAmountInCents: number; 
}

const StripeCheckoutForm: React.FC<StripeCheckoutFormProps> = ({ 
    onSuccessfulCheckout, 
    selectedTierAmountInCents 
}) => {
  const stripe = useStripe(); 
  const elements = useElements(); 

  const [message, setMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!stripe) {
      console.warn("StripeCheckoutForm: Stripe.js has not loaded yet.");
      return;
    }
    // Optional: Retrieve the PaymentIntent status if needed, but clientSecret usually handles this
    // const clientSecret = new URLSearchParams(window.location.search).get("payment_intent_client_secret");
    // if (!clientSecret) { return; }
    // stripe.retrievePaymentIntent(clientSecret).then(({ paymentIntent }) => { /* ... */ });
  }, [stripe]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!stripe || !elements) {
      setMessage("Payment system is initializing. Please wait a moment.");
      return;
    }

    setIsLoading(true);
    setMessage(null); 

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        // return_url should point to a page that can handle payment completion status
        // This could be the same page or a dedicated success/failure page.
        // For this example, we'll use the current origin + /upgrade route.
        // In a real app, you might want /payment-status?payment_intent=...
        return_url: `${window.location.origin}/upgrade`, 
      },
      redirect: "if_required" 
    });
    
    if (error) {
      console.error("Stripe confirmPayment error:", error);
      const displayError = error.message || "An unexpected error occurred during payment.";
      setMessage(displayError);
      toast.error(displayError);
    } else if (paymentIntent) {
       console.log("Stripe PaymentIntent status after confirmation:", paymentIntent.status);
       switch (paymentIntent.status) {
           case "succeeded":
             setMessage("Payment succeeded!");
             toast.success("Payment Successful!");
             onSuccessfulCheckout(paymentIntent.id);
             break;
           case "processing":
             setMessage("Your payment is processing. We will update you shortly.");
             toast.info("Payment processing...");
             break;
           case "requires_payment_method":
             setMessage("Payment failed. Please check your card details or try another card.");
             toast.error("Payment failed. Please try again.");
             break;
           default:
             setMessage(`Unexpected payment status: ${paymentIntent.status}`);
             toast.error("An unexpected issue occurred with your payment.");
             break;
       }
    } else {
        setMessage("An unexpected issue occurred. Please try again.");
        toast.error("Payment confirmation did not return expected details.");
    }
    setIsLoading(false);
  };

  const paymentElementOptions = {
    layout: "tabs" as const 
  };

  const displayAmount = (selectedTierAmountInCents / 100).toFixed(2);

  return (
    <form id="payment-form" onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement id="payment-element" options={paymentElementOptions} />
      <Button 
        disabled={isLoading || !stripe || !elements} 
        id="submit" 
        className="w-full py-3 text-base font-semibold"
        size="lg" // Make button larger
      >
        {isLoading 
            ? <Loader2 className="h-5 w-5 animate-spin" /> 
            : `Pay $${displayAmount} Now`
        }
      </Button>
      {message && (
        <div 
          id="payment-message" 
          className={`mt-4 text-sm p-3 rounded-md ${
            message.includes("fail") || message.includes("error") || message.toLowerCase().includes("unexpected")
              ? 'bg-red-900/30 text-red-400 border border-red-700' 
              : 'bg-green-900/30 text-green-400 border border-green-700'
          }`}
        >
            {message}
        </div>
      )}
    </form>
  );
}

export default StripeCheckoutForm;