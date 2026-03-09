import { loadStripe } from '@stripe/stripe-js';

// Your Stripe publishable key
const STRIPE_PUBLISHABLE_KEY = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY as string;

// Load Stripe
export const stripePromise = loadStripe(STRIPE_PUBLISHABLE_KEY);
