import Link from "next/link";

import { LEGAL_ENTITY } from "@/lib/legal";
import { marketingPath } from "@/lib/routes";
import { SITE_NAME, SITE_URL } from "@/lib/site";

export function LegalNoticeEn() {
  const e = LEGAL_ENTITY;
  return (
    <>
      <p>
        In accordance with article 10 of Spain’s Law 34/2002 on information society services
        and electronic commerce (LSSI-CE), this is who is behind {SITE_URL}:
      </p>
      <dl>
        <dt>Owner</dt>
        <dd>{e.name}</dd>
        <dt>Tax ID (NIF)</dt>
        <dd>{e.taxId}</dd>
        <dt>Address</dt>
        <dd>{e.address}</dd>
        <dt>Email</dt>
        <dd>{e.email}</dd>
        {e.registry ? (
          <>
            <dt>Registry</dt>
            <dd>{e.registry}</dd>
          </>
        ) : null}
      </dl>

      <h2>Purpose of this website</h2>
      <p>
        This site presents {SITE_NAME}, a CRM for independent real-estate agents, and gives
        access to the application. Using either is subject to this notice, the{" "}
        <Link href={marketingPath("terms", "en")}>Terms of Service</Link> and the{" "}
        <Link href={marketingPath("privacy", "en")}>Privacy Policy</Link>.
      </p>

      <h2>Prices</h2>
      <p>
        Prices for the Pro plan are shown in euros and exclude VAT, which is added at checkout
        at the rate that applies to you. The Free plan costs nothing. Payments are taken by
        Stripe over an encrypted connection; card details never reach our servers.
      </p>

      <h2>Contracting online</h2>
      <p>
        The agreement to use {SITE_NAME} is formed when you sign in, and a Pro subscription
        when you complete payment with Stripe. Before either step you can review the Terms
        of Service, which stay available on this site, and correct anything you have entered.
        We do not file a separate copy of each contract; Stripe emails you a receipt for
        every payment. The contract is available in English and Spanish.
      </p>

      <h2>Use of the site</h2>
      <p>
        You may browse the site and use the application in accordance with the Terms. You may
        not use it for anything unlawful, try to breach its security, or reproduce its
        content beyond what browsing requires.
      </p>

      <h2>Intellectual property</h2>
      <p>
        The name {SITE_NAME}, the logo, the software, the texts and the design are ours or
        licensed to us. Nothing here grants you a licence to them beyond using the service.
        The data you enter remains yours.
      </p>

      <h2>Links</h2>
      <p>
        Links to other sites are provided for convenience; we do not control them and are not
        responsible for their content.
      </p>

      <h2>Liability</h2>
      <p>
        We work to keep the site accurate and available, but cannot guarantee it is free of
        errors or interruptions, and we are not liable for damage caused by its use beyond
        what the law imposes. The Terms of Service set out the liability rules for the
        application.
      </p>

      <h2>Hosting</h2>
      <p>
        The site is hosted by Vercel, Inc. (United States, with servers in Europe).
        Application data is stored by Supabase, Inc. in {e.hostingRegion}.
      </p>

      <h2>Law</h2>
      <p>This notice is governed by Spanish law.</p>
    </>
  );
}
