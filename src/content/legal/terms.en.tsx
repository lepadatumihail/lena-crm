import Link from "next/link";

import { FREE_CLIENT_LIMIT } from "@/lib/access";
import { FOUNDING_CAP, PRICES } from "@/lib/billing";
import { LEGAL_ENTITY } from "@/lib/legal";
import { marketingPath } from "@/lib/routes";
import { SITE_NAME, SITE_URL } from "@/lib/site";

export function TermsEn() {
  const e = LEGAL_ENTITY;
  const privacy = marketingPath("privacy", "en");
  return (
    <>
      <p>
        These terms are the agreement between you and {e.name} for the use of {SITE_NAME} at{" "}
        {SITE_URL}. You accept them by signing in. If you do not agree with them, do not use
        the service.
      </p>

      <h2>1. Who can use {SITE_NAME}</h2>
      <p>
        {SITE_NAME} is a tool for real-estate professionals. You confirm that you are at least
        18, that you use the service in your professional activity as an agent or agency, and
        that you are not acting as a consumer. One person, one account; you are responsible
        for everything done with it. Keep your Google account and your email secure, because
        they are your keys.
      </p>

      <h2>2. The service</h2>
      <p>
        {SITE_NAME} is a web application to manage buyers and sellers, properties, viewings,
        offers, documents, appointments and follow-up messages, with optional AI drafting. We
        improve it continually, which means features change; we will not remove a core
        function without notice. Features labelled beta may be withdrawn at any time.
      </p>

      <h2>3. Plans and prices</h2>
      <ul>
        <li>
          Free: every feature, up to {FREE_CLIENT_LIMIT} clients (buyers and sellers
          together), no card, no time limit.
        </li>
        <li>
          Pro: unlimited clients for €{PRICES.standard.monthly} per month or €
          {PRICES.standard.yearly} per year. Prices are shown without VAT; the applicable VAT
          is added at checkout according to your country and VAT number.
        </li>
        <li>
          Founding price: the first {FOUNDING_CAP} paying agents get Pro at €
          {PRICES.founding.monthly} per month, or €{PRICES.founding.yearly} per year, for as
          long as their subscription stays active without interruption. If it lapses, the
          current price applies on return.
        </li>
      </ul>
      <p>
        We may change prices with at least 30 days’ notice by email. The new price applies
        from your next renewal, and you can cancel before then.
      </p>

      <h2>4. Payment, renewal and failed payments</h2>
      <p>
        Pro is billed in advance through Stripe, monthly or yearly, and renews automatically
        until you cancel. Stripe’s own terms apply to the payment itself. If a payment fails
        we retry for a few days and email you; if it still fails, your account returns to
        Free. Nothing is deleted when that happens: you keep everything and simply cannot add
        clients above the Free limit.
      </p>

      <h2>5. Cancelling and refunds</h2>
      <p>
        Cancel at any time from Billing, which opens the Stripe customer portal. Cancellation
        takes effect at the end of the period you have paid for: you keep Pro until then and
        then return to Free. We do not refund partial periods, except where the law requires
        it or if we end your Pro plan without cause, in which case we refund the unused part
        pro rata.
      </p>

      <h2>6. Referral programme</h2>
      <p>
        Every account has an invite link. When someone signs up through yours, becomes a
        paying Pro subscriber and stays one for the qualifying period shown on the Referrals
        page, you and they each receive one free month of Pro, applied as a credit to the
        next invoice. Credits have no cash value and cannot be transferred. Referrals of
        yourself, of accounts you control, or obtained through spam or misleading claims earn
        nothing and may cost you the programme. We can change or end the programme for the
        future with notice; credits already earned stay.
      </p>

      <h2>7. Your data and your clients’ data</h2>
      <p>
        Everything you enter belongs to you. You give us the permission needed to host,
        process, back up and display it in order to provide the service, and nothing more.
        You are the controller of your clients’ personal data and we are your processor,
        under the data processing agreement in the annex. You promise that:
      </p>
      <ul>
        <li>
          you have a lawful basis to hold and use each client’s data in {SITE_NAME}, and have
          informed them as the GDPR requires, including that you use software and AI
          assistance to manage and draft your communications with them;
        </li>
        <li>
          you store only what your work needs, including identity documents where
          anti-money-laundering rules require them, and handle them with the care they
          deserve;
        </li>
        <li>
          you have the right to contact the people you message, and your messages comply
          with the rules on commercial communications and with WhatsApp’s and your email
          provider’s terms.
        </li>
      </ul>
      <p>
        You can delete clients, documents and analyses at any time, and download a copy of
        your data whenever you like from Settings → Your data, as an Excel workbook and CSV
        files. For a copy of the files you uploaded, ask us and we will send it within 30
        days.
      </p>

      <h2>8. Acceptable use</h2>
      <p>
        Do not use {SITE_NAME} to break the law, send unsolicited bulk messages, store data
        you have no right to hold, harm or impersonate anyone, or upload malicious code. Do
        not scrape, probe, copy, resell or reverse-engineer the service, or use it to build a
        competing product. We may suspend an account that puts others or the service at
        risk, and will tell you why.
      </p>

      <h2>9. AI features</h2>
      <p>
        Lead capture, message drafting and voice notes use third-party language models (section
        5 of the{" "}
        <Link href={privacy}>Privacy Policy</Link>). Their output is a suggestion: it can be
        wrong, incomplete or unsuitable, and you must read it before you rely on it or send
        it. You are the author and sender of every message. We do not guarantee any result
        from these features, and we may change providers or limit usage to keep the service
        fair for everyone.
      </p>

      <h2>10. Third-party services</h2>
      <p>
        Sign in with Google, Google Calendar, WhatsApp, Stripe and the property portals
        belong to their owners and run under their own terms. {SITE_NAME} opens WhatsApp on
        your device with a pre-written message; the message is sent by you, through your own
        WhatsApp account.
      </p>

      <h2>11. Availability and support</h2>
      <p>
        We aim to keep {SITE_NAME} available at all times but cannot promise it, and we may
        pause it briefly for maintenance. Support is by email at {e.email}. The profit
        calculator produces estimates from the numbers you enter; it is not financial, legal
        or tax advice.
      </p>

      <h2>12. Intellectual property</h2>
      <p>
        {SITE_NAME}, its code, design and brand belong to us. You may use them only as part of
        the service. If you send us ideas or feedback, we may use them without owing you
        anything.
      </p>

      <h2>13. Ending the agreement</h2>
      <p>
        You can stop at any time: cancel Pro and, if you wish, ask us to delete your account.
        We can end the agreement if you breach these terms and do not fix it within 15 days
        of our notice, or immediately for a serious breach. When the account closes, your
        data is deleted within 30 days (section 10 of the Privacy Policy). Export anything
        you need first (Settings → Your data).
      </p>

      <h2>14. Warranties and liability</h2>
      <p>
        {SITE_NAME} is provided as it is. To the extent the law allows, we make no promise
        that it will meet every need or be free of errors, and we are not liable for indirect
        losses, lost profits, lost deals or data you did not back up. Our total liability for
        everything arising from this agreement is limited to what you paid us in the 12
        months before the claim, or €100 if you paid nothing. Nothing in these terms limits
        liability that cannot be limited under Spanish law, including liability for fraud or
        wilful misconduct.
      </p>

      <h2>15. Your responsibility to us</h2>
      <p>
        If a third party, including one of your clients, brings a claim against us because
        of data you stored or messages you sent through {SITE_NAME}, you will cover the
        reasonable costs and damages that result.
      </p>

      <h2>16. Changes to these terms</h2>
      <p>
        We may update these terms. For material changes we email you at least 30 days before
        they take effect; continuing to use the service after that date means you accept
        them, and you can cancel before then if you do not.
      </p>

      <h2>17. Law and courts</h2>
      <p>
        Spanish law governs this agreement. Any dispute will be heard by the Spanish courts
        with jurisdiction under the rules that apply to you. Our establishment is shown in
        the <Link href={marketingPath("legalNotice", "en")}>Legal Notice</Link>.
      </p>

      <h2>18. General</h2>
      <p>
        These terms, the <Link href={privacy}>Privacy Policy</Link> and the Legal Notice are
        the whole agreement. If a clause is invalid, the rest stands. You cannot transfer your
        account; we may transfer this agreement to a successor of the business. Notices go by
        email to the address on your account. These terms exist in English and Spanish; if
        they differ, the English version prevails.
      </p>

      <h2>Annex: data processing agreement</h2>
      <p>
        This annex is the contract that Article 28 GDPR requires between you, as controller,
        and us, as processor. It covers all personal data you store in {SITE_NAME} about your
        clients and contacts.
      </p>
      <h3>A. What is processed</h3>
      <ul>
        <li>
          Subject matter and duration: hosting and processing of your CRM data for as long as
          you have an account.
        </li>
        <li>
          Nature and purpose: storage, organisation, display, search, matching, message
          drafting, reminders and backups, so that you can run your real-estate activity.
        </li>
        <li>
          Data: identity and contact details, language, nationality, budgets and preferences,
          notes, property and viewing records, offers, reservation dates, appointments,
          documents you upload (which may include identity documents and contracts), and
          messages you draft.
        </li>
        <li>Data subjects: your buyers, sellers, prospects and their contacts.</li>
      </ul>
      <h3>B. Our obligations</h3>
      <ul>
        <li>
          We process the data only on your documented instructions, which are these terms and
          your use of the service, unless EU or Spanish law requires otherwise, in which case
          we tell you first where we may.
        </li>
        <li>Everyone who accesses the data on our behalf is bound by confidentiality.</li>
        <li>We apply the security measures in section C and keep them up to date.</li>
        <li>
          We help you answer data-subject requests and meet your obligations on security,
          breach notification and impact assessments, in proportion to what we hold.
        </li>
        <li>
          We tell you without undue delay after becoming aware of a personal data breach
          affecting your data, with everything we know about it.
        </li>
        <li>
          At the end of the service we delete all the data within 30 days, or return it first
          if you ask. We keep only what the law requires, blocked, for as long as liability
          could arise.
        </li>
        <li>
          We make available the information needed to show compliance and allow audits: once
          a year, on reasonable notice, at your cost, and without exposing other agents’
          data.
        </li>
      </ul>
      <h3>C. Security measures</h3>
      <p>
        Encryption in transit and at rest; row-level security separating each agent’s data;
        sign-in by Google or one-time codes, with no stored passwords; server-only secrets;
        least-privilege access to production; provider backups; logging of administrative
        access. Full details on request.
      </p>
      <h3>D. Sub-processors</h3>
      <p>
        You authorise the providers listed in section 6 of the{" "}
        <Link href={privacy}>Privacy Policy</Link>. We will tell you by email at least 30 days
        before adding or replacing one. If you object on reasonable data protection grounds
        within 14 days and we cannot resolve it, you may end the agreement and we refund any
        unused Pro period. Each sub-processor is bound by data protection obligations
        equivalent to ours, and we remain responsible for them.
      </p>
      <h3>E. Transfers</h3>
      <p>
        Data is stored in the European Union. Transfers to sub-processors outside the EEA
        rely on the EU-US Data Privacy Framework or the standard contractual clauses, as
        listed in the Privacy Policy.
      </p>
      <h3>F. Your obligations</h3>
      <p>
        You are responsible for the lawfulness of the data and of your instructions, for
        informing data subjects, and for answering their requests. You will not instruct us
        to process data in a way that breaks the law.
      </p>
      <h3>G. Liability</h3>
      <p>
        Section 14 applies to this annex, without prejudice to what the GDPR provides between
        controller and processor.
      </p>
    </>
  );
}
