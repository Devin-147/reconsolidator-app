// src/components/payment/StripeCheckoutForm.tsx
import React, { useState, useEffect } from 'react';
import {
  PaymentElement,
  useStripe,
  useElements
} from "@stripe/react-stripe-js";
import { Button } from "@/components/ui/button"; // Use your button component
import { toast } from "sonner"; // Use your toast component

interface StripeCheckoutFormProps {
  onSuccessfulCheckout: (paymentIntentId: string) => void; // Callback on success
}

const StripeCheckoutForm: React.FC<StripeCheckoutFormProps> = ({ onSuccessfulCheckout }) => {
  const stripe = useStripe(); // Hook to get the Stripe instance
  const elements = useElements(); // Hook to get Elements instance

  const [message, setMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Check if Stripe.js has loaded
    if (!stripe) {
      return;
    }
    // You could retrieve the PaymentIntent status here if needed,
    // but usually, the clientSecret passed to <Elements> handles setup.
  }, [stripe]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!stripe || !elements) {
      // Stripe.js hasn't yet loaded.
      // Make sure to disable form submission until Stripe.js has loaded.
      console.log("Stripe.js hasn't loaded yet.");
      setMessage("Payment system is not ready. Please wait a moment.");
      return;
    }

    setIsLoading(true);
    setMessage(null); // Clear previous messages

    // --- Trigger confirmation ---
    // This uses the Payment Element to automatically handle card details, 3D Secure, etc.
    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        // IMPORTANT: Provide the URL your users should be redirected back to
        // AFTER they complete any necessary actions (like 3D Secure).
        // This should typically be a page that checks the payment status.
        // For simplicity now, we can redirect back to the upgrade page itself
        // or maybe a dedicated /payment-success or /payment-failure route.
        // Let's use '/upgrade' for now, but a dedicated status page is better practice.
        return_url: `${window.location.origin}/upgrade`, // Or a dedicated success/status page
      },
      // We prevent redirection here and handle the result directly
      redirect: "if_required" // Important: Use "if_required" to handle redirect manually below if needed
    });
    // --- End confirmation ---


    if (error) {
      // This point will only be reached if there is an immediate error occurring
      // during payment confirmation, such as invalid card details.
      // Show error to your customer (e.g., payment details incomplete)
      console.error("Stripe confirmPayment error:", error);
      setMessage(error.message || "An unexpected error occurred.");
      toast.error(error.message || "Payment failed. Please check your details.");
    } else if (paymentIntent) {
       // PaymentIntent status should be checked.
       // If `redirect: 'if_required'` was used and a redirect didn't happen,
       // the paymentIntent status tells you the result.
       console.log("Stripe PaymentIntent status after confirmation:", paymentIntent.status);
       switch (paymentIntent.status) {
           case "succeeded":
             setMessage("Payment succeeded!");
             toast.success("Payment Successful!");
             // Call the success callback passed from PaymentPage
             onSuccessfulCheckout(paymentIntent.id);
             break;
           case "processing":
             setMessage("Your payment is processing.");
             toast.info("Payment processing...");
             break;
           case "requires_payment_method":
             setMessage("Your payment was not successful, please try another card.");
             toast.error("Payment failed. Please try again or use a different card.");
             break;
           default:
             setMessage("Something went wrong with the payment.");
             toast.error("An unexpected payment status occurred.");
             break;
       }
    } else {
        // This case should generally not happen if using confirmPayment correctly
        setMessage("An unexpected issue occurred. Please try again.");
        toast.error("Payment confirmation returned unexpectedly.");
    }


    setIsLoading(false);
  };

  const paymentElementOptions = {
    layout: "tabs" as const // Or 'accordion', 'tabs', 'auto'
  };

  return (
    <form id="payment-form" onSubmit={handleSubmit}>
      <PaymentElement id="payment-element" options={paymentElementOptions} />
      <Button disabled={isLoading || !stripe || !elements} id="submit" className="w-full mt-6">
        <span id="button-text">
          {isLoading ? <div className="spinner" id="spinner"></div> : "Pay $47.00 Now"}
        </span>
      </Button>
      {/* Show any error or success messages */}
      {message && <div id="payment-message" className={`mt-4 text-sm ${message.includes("fail") || message.includes("error") ? 'text-red-500' : 'text-green-500'}`}>{message}</div>}
    </form>
  );
}

export default StripeCheckoutForm; // Ensure default export