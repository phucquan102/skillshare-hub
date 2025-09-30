// services/payment/stripeService.ts
import { loadStripe, Stripe } from '@stripe/stripe-js';

console.log("👉 Stripe env key:", process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY);

const publishableKey = process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY;

if (!publishableKey) {
  console.error("❌ Stripe publishable key is missing. Check your .env file!");
}

// ✅ Chỉ load stripe nếu có publishable key
let stripePromise: Promise<Stripe | null> | null = null;

if (publishableKey) {
  stripePromise = loadStripe(publishableKey);
}

export const stripeService = {
  getStripe: () => {
    if (!stripePromise) {
      console.error("❌ Stripe not initialized - missing publishable key");
      return null;
    }
    return stripePromise;
  },
};