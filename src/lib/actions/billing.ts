"use server";

import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { getStripe } from "@/lib/stripe";
import { SITE_URL } from "@/lib/site";

/**
 * Stripe Customer Portal: cancel, change the card, see invoices. The portal
 * configuration in the Stripe dashboard must have plan switching disabled so
 * nobody can be moved on or off the founding price. Opens from /billing and
 * returns there.
 */
export async function openBillingPortal() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("stripe_customer_id")
    .eq("id", user.id)
    .maybeSingle();

  const stripe = getStripe();
  if (!stripe || !profile?.stripe_customer_id) redirect("/billing?portal=unavailable");

  const session = await stripe.billingPortal.sessions.create({
    customer: profile.stripe_customer_id,
    return_url: `${SITE_URL}/billing`,
  });
  redirect(session.url);
}
