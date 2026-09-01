import Stripe from "stripe";

/**
 * Server-only Stripe client. Returns null until STRIPE_SECRET_KEY is set so
 * every caller degrades gracefully (credits stay "unapplied", the webhook
 * answers 503) instead of crashing a build or a page.
 */
let cached: Stripe | null | undefined;

export function isStripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

export function getStripe(): Stripe | null {
  if (cached !== undefined) return cached;
  const key = process.env.STRIPE_SECRET_KEY;
  cached = key ? new Stripe(key) : null;
  return cached;
}
