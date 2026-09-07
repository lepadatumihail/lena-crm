/**
 * One-shot, idempotent Stripe setup for LeadWing Pro. Safe to re-run; reuses
 * whatever already exists. Run it once against test mode, then once more with
 * the live key.
 *
 *   npm run stripe:setup            # reads STRIPE_SECRET_KEY from .env.local
 *   npm run stripe:setup -- --live  # required when the key is a live key
 *
 * What it does, in order:
 *   0. Stripe Tax: a default tax code and the Spain VAT registration, without
 *      which Stripe collects nothing.
 *   1. Product "LeadWing Pro" (found or created).
 *   2. Four recurring prices with lookup keys = plan ids (the webhook reads
 *      them). Existing prices with the right amount and interval are adopted
 *      by giving them the lookup key; missing ones are created. Tax behaviour
 *      is exclusive ("+ IVA").
 *   3. One Payment Link per price: Stripe Tax + tax-ID collection on, promo
 *      codes off, redirect to /billing?upgraded=1. The link id is stored in
 *      the price's metadata so re-runs reuse it.
 *   4. The webhook endpoint (www host, five events). The signing secret is
 *      only shown when the endpoint is created.
 *   5. The default Customer Portal configuration: cancel at period end,
 *      payment method + invoice history on, plan switching OFF.
 *   6. Prints the env lines for Vercel / .env.local.
 *
 * Nothing is deleted or archived. Duplicates you created by hand are listed
 * at the end so you can archive them in the dashboard.
 */
import Stripe from "stripe";

import {
  PLAN_IDS,
  PRICES,
  planInterval,
  planLabel,
  planTier,
  type BillingPlan,
} from "../src/lib/billing.ts";

const SITE =
  process.env.STRIPE_SETUP_SITE?.trim() || "https://www.leadwing.app";
const PRODUCT_NAME = "LeadWing Pro";
/** Stripe Tax code: software as a service, business use. An electronically supplied service for EU VAT. */
const TAX_CODE = "txcd_10103001";
/** Account-wide default for anything without its own code: General - Electronically Supplied Services. */
const DEFAULT_TAX_CODE = "txcd_10000000";
/** Where LeadWing is VAT-registered. Stripe Tax only collects where a registration exists. */
const TAX_COUNTRY = "ES";
const WEBHOOK_URL = `${SITE}/api/stripe/webhook`;
const WEBHOOK_EVENTS: Stripe.WebhookEndpointCreateParams.EnabledEvent[] = [
  "checkout.session.completed",
  "invoice.paid",
  "invoice.payment_failed",
  "customer.subscription.updated",
  "customer.subscription.deleted",
];
const ENV_VAR: Record<BillingPlan, string> = {
  founding_monthly: "NEXT_PUBLIC_STRIPE_LINK_FOUNDING_MONTHLY",
  founding_yearly: "NEXT_PUBLIC_STRIPE_LINK_FOUNDING_YEARLY",
  standard_monthly: "NEXT_PUBLIC_STRIPE_LINK_STANDARD_MONTHLY",
  standard_yearly: "NEXT_PUBLIC_STRIPE_LINK_STANDARD_YEARLY",
};

const args = new Set(process.argv.slice(2));
const key = process.env.STRIPE_SECRET_KEY?.trim();
if (!key) {
  console.error(
    "STRIPE_SECRET_KEY is not set. Put it in .env.local (test key first: sk_test_…).",
  );
  process.exit(1);
}
const live = key.startsWith("sk_live_");
if (live && !args.has("--live")) {
  console.error(
    "That is a LIVE key. Re-run with --live if you really mean it.",
  );
  process.exit(1);
}
console.log(`Mode: ${live ? "LIVE" : "test"} · site: ${SITE}\n`);

const stripe = new Stripe(key);
const notes: string[] = [];

function amountFor(plan: BillingPlan): number {
  return PRICES[planTier(plan)][planInterval(plan)] * 100;
}
function intervalFor(plan: BillingPlan): "month" | "year" {
  return planInterval(plan) === "monthly" ? "month" : "year";
}
function productIdOf(price: Stripe.Price): string {
  return typeof price.product === "string" ? price.product : price.product.id;
}

// ---------- 1. product ----------
async function ensureProduct(): Promise<Stripe.Product> {
  const all = await stripe.products.list({ active: true, limit: 100 });
  const tagged = all.data.find((p) => p.metadata?.leadwing === "pro");
  if (tagged) return tagged;
  const named = all.data.find(
    (p) => p.name.trim().toLowerCase() === PRODUCT_NAME.toLowerCase(),
  );
  if (named) {
    console.log(`Product: adopting "${named.name}" (${named.id})`);
    return stripe.products.update(named.id, { metadata: { leadwing: "pro" } });
  }
  const created = await stripe.products.create({
    name: PRODUCT_NAME,
    metadata: { leadwing: "pro" },
    tax_code: TAX_CODE,
  });
  console.log(`Product: created ${created.id}`);
  return created;
}

/** Stripe Tax needs a tax code on every product sold through a link. */
const taxCoded = new Set<string>();
async function ensureTaxCode(productId: string): Promise<void> {
  if (taxCoded.has(productId)) return;
  taxCoded.add(productId);
  const product = await stripe.products.retrieve(productId);
  if (product.tax_code) return;
  await stripe.products.update(productId, { tax_code: TAX_CODE });
  console.log(`Product ${productId}: set tax code ${TAX_CODE}`);
}

// ---------- 2. prices ----------
async function ensurePrice(
  plan: BillingPlan,
  product: Stripe.Product,
  pool: Stripe.Price[],
): Promise<Stripe.Price> {
  const byKey = await stripe.prices.list({
    lookup_keys: [plan],
    active: true,
    limit: 1,
  });
  if (byKey.data[0]) {
    console.log(`Price ${plan}: exists (${byKey.data[0].id})`);
    await ensureTaxCode(productIdOf(byKey.data[0]));
    return byKey.data[0];
  }
  const candidate = pool.find(
    (p) =>
      p.unit_amount === amountFor(plan) &&
      p.recurring?.interval === intervalFor(plan) &&
      !p.lookup_key,
  );
  if (candidate) {
    const patch: Stripe.PriceUpdateParams = {
      lookup_key: plan,
      transfer_lookup_key: true,
      nickname: planLabel(plan),
    };
    if (candidate.tax_behavior === "unspecified")
      patch.tax_behavior = "exclusive";
    const updated = await stripe.prices.update(candidate.id, patch);
    console.log(`Price ${plan}: adopted ${candidate.id} (set lookup key)`);
    await ensureTaxCode(productIdOf(updated));
    if (updated.tax_behavior !== "exclusive") {
      notes.push(
        `Price ${plan} (${candidate.id}) has tax behaviour "${updated.tax_behavior}"; it cannot be changed once set. Archive it and re-run to get an exclusive one.`,
      );
    }
    return updated;
  }
  const created = await stripe.prices.create({
    product: product.id,
    currency: "eur",
    unit_amount: amountFor(plan),
    recurring: { interval: intervalFor(plan) },
    lookup_key: plan,
    transfer_lookup_key: true,
    tax_behavior: "exclusive",
    nickname: planLabel(plan),
  });
  console.log(`Price ${plan}: created ${created.id}`);
  return created;
}

// ---------- 3. payment links ----------
async function ensurePaymentLink(
  plan: BillingPlan,
  price: Stripe.Price,
): Promise<Stripe.PaymentLink> {
  const existingId = price.metadata?.payment_link;
  if (existingId) {
    try {
      const existing = await stripe.paymentLinks.retrieve(existingId);
      if (existing.active) {
        if (existing.automatic_tax?.enabled) {
          console.log(`Link ${plan}: exists (${existing.id})`);
          return existing;
        }
        try {
          const fixed = await stripe.paymentLinks.update(existing.id, {
            automatic_tax: { enabled: true },
            tax_id_collection: { enabled: true },
          });
          console.log(
            `Link ${plan}: exists (${existing.id}); Stripe Tax switched on`,
          );
          return fixed;
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          notes.push(
            `Link ${plan} (${existing.id}) still has Stripe Tax OFF: ${message}`,
          );
          return existing;
        }
      }
    } catch {
      // fall through and create a fresh one
    }
  }
  const base: Stripe.PaymentLinkCreateParams = {
    line_items: [{ price: price.id, quantity: 1 }],
    after_completion: {
      type: "redirect",
      redirect: { url: `${SITE}/billing?upgraded=1` },
    },
    allow_promotion_codes: false,
    billing_address_collection: "required",
    tax_id_collection: { enabled: true },
    metadata: { leadwing_plan: plan },
  };
  let link: Stripe.PaymentLink;
  try {
    link = await stripe.paymentLinks.create({
      ...base,
      automatic_tax: { enabled: true },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    notes.push(
      `Link ${plan}: created WITHOUT Stripe Tax (${message}). Enable Stripe Tax in the dashboard, archive this link and re-run.`,
    );
    link = await stripe.paymentLinks.create(base);
  }
  await stripe.prices.update(price.id, {
    metadata: { ...price.metadata, payment_link: link.id },
  });
  console.log(`Link ${plan}: created ${link.id}`);
  return link;
}

// ---------- 4. webhook ----------
async function ensureWebhook(): Promise<string | null> {
  const endpoints = await stripe.webhookEndpoints.list({ limit: 100 });
  const existing = endpoints.data.find((e) => e.url === WEBHOOK_URL);
  if (existing) {
    const missing = WEBHOOK_EVENTS.filter(
      (ev) => !existing.enabled_events.includes(ev),
    );
    if (missing.length) {
      await stripe.webhookEndpoints.update(existing.id, {
        enabled_events: Array.from(
          new Set([...existing.enabled_events, ...WEBHOOK_EVENTS]),
        ) as Stripe.WebhookEndpointUpdateParams.EnabledEvent[],
      });
      console.log(
        `Webhook: exists (${existing.id}); added events ${missing.join(", ")}`,
      );
    } else {
      console.log(`Webhook: exists (${existing.id})`);
    }
    notes.push(
      "Webhook signing secret: reveal it in Developers → Webhooks (it is only returned on creation).",
    );
    return null;
  }
  const created = await stripe.webhookEndpoints.create({
    url: WEBHOOK_URL,
    enabled_events: WEBHOOK_EVENTS,
    description: "LeadWing billing",
  });
  console.log(`Webhook: created ${created.id}`);
  return created.secret ?? null;
}

// ---------- 5. customer portal ----------
async function ensurePortal(): Promise<void> {
  const features: Stripe.BillingPortal.ConfigurationCreateParams.Features = {
    invoice_history: { enabled: true },
    payment_method_update: { enabled: true },
    subscription_cancel: { enabled: true, mode: "at_period_end" },
    subscription_update: { enabled: false },
    customer_update: {
      enabled: true,
      allowed_updates: ["name", "email", "address", "tax_id"],
    },
  };
  const configs = await stripe.billingPortal.configurations.list({ limit: 20 });
  const current = configs.data.find((c) => c.is_default) ?? configs.data[0];
  if (current) {
    await stripe.billingPortal.configurations.update(current.id, {
      features,
      default_return_url: `${SITE}/billing`,
      business_profile: { headline: "LeadWing — manage your Pro subscription" },
    });
    console.log(
      `Portal: updated ${current.id} (plan switching off, cancel at period end)`,
    );
    return;
  }
  const created = await stripe.billingPortal.configurations.create({
    features,
    default_return_url: `${SITE}/billing`,
    business_profile: { headline: "LeadWing — manage your Pro subscription" },
  });
  console.log(`Portal: created ${created.id}`);
}

// ---------- 0. tax settings + registration ----------
async function ensureTax(): Promise<void> {
  const settings = await stripe.tax.settings.retrieve();
  if (!settings.defaults.tax_code) {
    await stripe.tax.settings.update({
      defaults: { tax_code: DEFAULT_TAX_CODE, tax_behavior: "exclusive" },
    });
    console.log(
      `Tax settings: default tax code set (${DEFAULT_TAX_CODE}), prices exclusive of tax`,
    );
  }
  if (settings.status !== "active") {
    notes.push(
      `Tax settings status is "${settings.status}": add the head-office address under Settings → Tax, or links cannot calculate tax.`,
    );
  }
  const registrations = await stripe.tax.registrations.list({ limit: 100 });
  const existing = registrations.data.find(
    (r) => r.country === TAX_COUNTRY && r.status !== "expired",
  );
  if (existing) {
    console.log(`Tax registration: ${TAX_COUNTRY} exists (${existing.status})`);
    return;
  }
  const created = await stripe.tax.registrations.create({
    country: TAX_COUNTRY,
    country_options: { es: { type: "standard" } },
    active_from: "now",
  });
  console.log(
    `Tax registration: created ${TAX_COUNTRY} VAT, active now (${created.id})`,
  );
}

// ---------- run ----------
async function main() {
  if (!args.has("--skip-tax")) {
    try {
      await ensureTax();
    } catch (err) {
      notes.push(
        `Tax: could not configure automatically (${err instanceof Error ? err.message : err}). Add the Spain VAT registration under Tax → Registrations by hand.`,
      );
    }
  }
  const product = await ensureProduct();
  await ensureTaxCode(product.id);
  const pool = (
    await stripe.prices.list({
      active: true,
      type: "recurring",
      currency: "eur",
      limit: 100,
    })
  ).data;

  const prices = {} as Record<BillingPlan, Stripe.Price>;
  for (const plan of PLAN_IDS)
    prices[plan] = await ensurePrice(plan, product, pool);

  const links = {} as Record<BillingPlan, Stripe.PaymentLink>;
  for (const plan of PLAN_IDS)
    links[plan] = await ensurePaymentLink(plan, prices[plan]);

  const webhookSecret = args.has("--skip-webhook")
    ? null
    : await ensureWebhook();
  if (!args.has("--skip-portal")) {
    try {
      await ensurePortal();
    } catch (err) {
      notes.push(
        `Portal: could not configure automatically (${err instanceof Error ? err.message : err}). Set it in Settings → Billing → Customer portal: cancel on, payment method on, plan switching OFF.`,
      );
    }
  }

  // Leftovers: active recurring EUR prices we did not adopt.
  const used = new Set(Object.values(prices).map((p) => p.id));
  const leftovers = pool.filter((p) => !used.has(p.id));
  if (leftovers.length) {
    notes.push(
      `Unused active prices you may want to archive: ${leftovers
        .map(
          (p) =>
            `${p.id} (€${(p.unit_amount ?? 0) / 100}/${p.recurring?.interval})`,
        )
        .join(", ")}`,
    );
  }

  console.log(
    "\n===== env (add to Vercel → Production, and to .env.local) =====",
  );
  for (const plan of PLAN_IDS)
    console.log(`${ENV_VAR[plan]}=${links[plan].url}`);
  console.log(`STRIPE_SECRET_KEY=<the key you ran this with>`);
  console.log(
    `STRIPE_WEBHOOK_SECRET=${webhookSecret ?? "<reveal in Developers → Webhooks>"}`,
  );
  if (notes.length) {
    console.log("\n===== notes =====");
    for (const n of notes) console.log(`- ${n}`);
  }
}

main().catch((err: unknown) => {
  const message = err instanceof Error ? err.message : String(err);
  console.error(`\nStripe error: ${message}`);
  process.exit(1);
});
