import { NextResponse } from "next/server";
import type Stripe from "stripe";

import { getStripe } from "@/lib/stripe";
import { mapStripeSubscriptionStatus } from "@/lib/referrals/stripe-status";
import {
  claimStripeEvent,
  findProfileByEmail,
  findProfileByStripeCustomer,
  getProfile,
  promoteToFounder,
  recordPaidInvoice,
  setSubscriptionStatus,
  voidReferral,
} from "@/lib/referrals/engine";

/**
 * Stripe → LeadWing. Drives the whole billing side of the referral model:
 *   checkout.session.completed  → link the Stripe customer, mark active,
 *                                 allocate a Founding number if invited
 *   invoice.paid                → count the invoice towards the referral
 *                                 reward (2nd one pays both sides)
 *   invoice.payment_failed      → past_due (dunning grace)
 *   customer.subscription.*     → mirror status; cancellation voids a pending
 *                                 referral
 * Every event id is recorded first so Stripe's retries are harmless.
 */
export async function POST(request: Request) {
  const stripe = getStripe();
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripe || !secret) {
    return NextResponse.json({ error: "Stripe is not configured" }, { status: 503 });
  }
  const signature = request.headers.get("stripe-signature");
  if (!signature) return NextResponse.json({ error: "Missing signature" }, { status: 400 });

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(await request.text(), signature, secret);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    if (!(await claimStripeEvent(event.id, event.type))) {
      return NextResponse.json({ received: true, duplicate: true });
    }
    await handle(event);
  } catch (err) {
    console.error(`stripe webhook ${event.type} failed`, err);
    return NextResponse.json({ error: "Handler failed" }, { status: 500 });
  }
  return NextResponse.json({ received: true });
}

function customerId(
  c: string | Stripe.Customer | Stripe.DeletedCustomer | null | undefined
): string | null {
  if (!c) return null;
  return typeof c === "string" ? c : c.id;
}

async function foundingAllocation(userId: string) {
  const profile = await getProfile(userId);
  if (profile?.founding_intent && profile.founding_number == null) {
    await promoteToFounder(userId);
  }
}

async function handle(event: Stripe.Event) {
  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object;
      const customer = customerId(session.customer);
      const email = session.customer_details?.email ?? session.customer_email ?? null;
      const userId =
        session.client_reference_id ?? (email ? (await findProfileByEmail(email))?.id ?? null : null);
      if (!userId) return;
      await setSubscriptionStatus(userId, "active", customer ? { stripe_customer_id: customer } : {});
      await foundingAllocation(userId);
      return;
    }
    case "invoice.paid": {
      const customer = customerId(event.data.object.customer);
      if (!customer) return;
      const profile = await findProfileByStripeCustomer(customer);
      if (!profile) return;
      await setSubscriptionStatus(profile.id, "active");
      await foundingAllocation(profile.id);
      await recordPaidInvoice(profile.id);
      return;
    }
    case "invoice.payment_failed": {
      const customer = customerId(event.data.object.customer);
      const profile = customer ? await findProfileByStripeCustomer(customer) : null;
      if (profile) await setSubscriptionStatus(profile.id, "past_due");
      return;
    }
    case "customer.subscription.updated": {
      const sub = event.data.object;
      const mapped = mapStripeSubscriptionStatus(sub.status);
      const customer = customerId(sub.customer);
      if (!mapped || !customer) return;
      const profile = await findProfileByStripeCustomer(customer);
      if (!profile) return;
      await setSubscriptionStatus(profile.id, mapped);
      if (mapped === "canceled") await voidReferral(profile.id);
      return;
    }
    case "customer.subscription.deleted": {
      const customer = customerId(event.data.object.customer);
      const profile = customer ? await findProfileByStripeCustomer(customer) : null;
      if (!profile) return;
      await setSubscriptionStatus(profile.id, "canceled");
      await voidReferral(profile.id);
      return;
    }
    default:
      return;
  }
}
