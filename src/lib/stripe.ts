import Stripe from "stripe";

// Lazy singleton — initialized on first call, not at module load time.
// This prevents build-time failures when STRIPE_SECRET_KEY isn't available.
let _stripe: Stripe | undefined;

export function getStripe(): Stripe {
  if (!_stripe) {
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: "2025-02-24.acacia",
      typescript: true,
    });
  }
  return _stripe;
}

export const PLANS = {
  monthly: {
    priceId: process.env.STRIPE_PRICE_MONTHLY!,
    name: "Premium Monthly",
    price: 7.99,
    interval: "month" as const,
  },
  yearly: {
    priceId: process.env.STRIPE_PRICE_YEARLY!,
    name: "Premium Yearly",
    price: 59.99,
    interval: "year" as const,
    savings: "37%",
  },
};

export const PREMIUM_FEATURES = [
  "Unlimited daily matches",
  "Unlimited space creation",
  "Priority in match algorithm",
  "See who liked your profile",
  "Advanced filters (reading pace, rating style)",
  "Ad-free experience",
  "Custom profile themes",
  "Early access to new features",
] as const;
