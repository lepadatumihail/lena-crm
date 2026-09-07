import Link from "next/link";

import { LEGAL_ENTITY } from "@/lib/legal";
import { marketingPath } from "@/lib/routes";
import { SITE_NAME } from "@/lib/site";

export function PrivacyEn() {
  const e = LEGAL_ENTITY;
  return (
    <>
      <p>
        This policy explains what {SITE_NAME} does with personal data: the data about you as
        an agent using the service, and the data you keep about your own clients. It follows
        the GDPR and the Spanish data protection law (LOPDGDD), in plain language.
      </p>

      <h2>1. Who is responsible</h2>
      <p>{SITE_NAME} is operated by:</p>
      <dl>
        <dt>Name</dt>
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
      <p>
        For the data about your account we are the controller. For the data you keep about
        your clients we act on your instructions as a processor (section 4). We have not
        appointed a data protection officer; write to the email above for anything to do
        with personal data.
      </p>

      <h2>2. The short version</h2>
      <table>
        <tbody>
          <tr>
            <th scope="row">Controller</th>
            <td>
              {e.name}, {e.email}
            </td>
          </tr>
          <tr>
            <th scope="row">Purposes</th>
            <td>
              Run your account and the CRM; bill Pro subscriptions; keep the service secure;
              answer support; measure use of the public website.
            </td>
          </tr>
          <tr>
            <th scope="row">Lawful basis</th>
            <td>
              Our contract with you; our legal obligations (tax and accounting); our
              legitimate interest in security and in understanding how the service is used;
              your consent where we ask for it.
            </td>
          </tr>
          <tr>
            <th scope="row">Recipients</th>
            <td>
              The providers that host and run the service (section 6); authorities when the
              law requires it. Nobody else.
            </td>
          </tr>
          <tr>
            <th scope="row">Rights</th>
            <td>
              Access, rectification, erasure, restriction, portability and objection, by
              email; complaint to the Spanish Data Protection Agency (section 9).
            </td>
          </tr>
          <tr>
            <th scope="row">More</th>
            <td>Sections 3 to 13 below.</td>
          </tr>
        </tbody>
      </table>

      <h2>3. Data about you</h2>
      <h3>What we collect</h3>
      <ul>
        <li>
          Account: your email address; your name, if you sign in with Google or add it; your
          interface language; and the sign-in method you use (Google, or a one-time code by
          email). When you sign in with Google, Google gives us your email address and
          name, which we use only to create and recognise your account. We never see or
          store a password.
        </li>
        <li>
          Billing, on Pro only: the details Stripe collects at checkout, such as name,
          billing address, VAT number and payment method, and the status of your
          subscription. Card numbers go straight to Stripe and never touch our servers.
        </li>
        <li>
          Referrals: your invite code, who invited you and whom you invited, and the credits
          earned.
        </li>
        <li>
          Use of the service: the clients, properties, viewings, offers, appointments,
          templates, calculator analyses and documents you create, and when you did so.
        </li>
        <li>
          Technical data: IP address, browser and device type in short-lived server logs,
          and aggregated, cookie-free statistics about the public website (section 8).
        </li>
        <li>Support: what you write to us by email.</li>
      </ul>
      <h3>Why, and on what basis</h3>
      <ul>
        <li>
          To provide the service, sign you in, remember your language and send the emails
          the service needs (sign-in codes, the reminders you set, billing notices):
          performance of our contract with you (art. 6(1)(b) GDPR).
        </li>
        <li>
          To bill Pro subscriptions, issue invoices and keep accounting records: our
          contract, and our legal obligations under Spanish tax and commercial law (art.
          6(1)(c)).
        </li>
        <li>
          To keep the service secure, prevent abuse and fix problems: our legitimate
          interest in running a reliable service (art. 6(1)(f)).
        </li>
        <li>
          To understand how the public website is used: our legitimate interest, using
          statistics that do not identify you.
        </li>
        <li>To run the referral programme you take part in: our contract with you.</li>
        <li>
          To send you news about {SITE_NAME}: only if you ask us to, and you can opt out at
          any time (consent, art. 6(1)(a)). We send no marketing email today.
        </li>
      </ul>
      <p>
        An email address is necessary to open an account; without it we cannot provide the
        service. We make no automated decisions with legal effects about you, and we do not
        profile you.
      </p>

      <h2>4. Data about your clients</h2>
      <p>
        When you add a buyer or seller to {SITE_NAME}, you decide what to store: name, phone,
        email, language, nationality, budget and preferences, notes, the properties they
        view, offers, reservation dates, appointments, and any documents you upload, such as
        contracts or identity documents.
      </p>
      <p>For this data you are the controller and we are your processor. In plain terms:</p>
      <ul>
        <li>
          We process it only to provide the service to you and on your instructions, under
          the data processing agreement in our{" "}
          <Link href={marketingPath("terms", "en")}>Terms of Service</Link>.
        </li>
        <li>
          You are responsible for having a lawful basis to keep it, for telling your clients
          how their data is used (arts. 13 and 14 GDPR), for keeping it accurate, and for any
          retention rule that applies to you, such as anti-money-laundering obligations for
          estate agents.
        </li>
        <li>
          Only you can see it. Every agent’s data is isolated by row-level security in the
          database; other agents, including colleagues at the same agency, cannot reach your
          book. We access it ourselves only when you ask for support or when it is strictly
          needed to operate the service.
        </li>
        <li>
          If one of your clients contacts us about their data, we will refer them to you and
          help you respond.
        </li>
      </ul>

      <h2>5. AI features</h2>
      <p>
        Two features use a third-party language model: pasting a portal enquiry to create a
        lead, and drafting messages or emails to a client. They run only when you press the
        button.
      </p>
      <ul>
        <li>
          What is sent: for lead capture, the text you paste. For drafts, the client’s name,
          whether they buy or sell, their pipeline stage and agency tag, budget and
          preferences, their most recent viewing or offer, reservation dates, and any draft
          or instruction you type.
        </li>
        <li>
          Who receives it: OpenRouter, Inc. (United States), which routes the request to
          OpenAI’s models. Under their business terms the content is not used to train
          models and is kept, if at all, only briefly for abuse monitoring.
        </li>
        <li>
          What comes back is a suggestion. Nothing reaches your client until you read it and
          send it yourself, and the model sees nothing beyond the request.
        </li>
      </ul>
      <p>
        If you would rather not send client data to an AI provider, do not use these two
        features; the rest of the service works without them.
      </p>

      <h2>6. Who we share data with</h2>
      <p>
        We do not sell personal data and we do not share it for advertising. The service
        runs on these providers, each bound by a data processing agreement:
      </p>
      <table>
        <thead>
          <tr>
            <th scope="col">Provider</th>
            <th scope="col">What for</th>
            <th scope="col">Where</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Supabase, Inc.</td>
            <td>Database, sign-in and file storage</td>
            <td>{e.hostingRegion}</td>
          </tr>
          <tr>
            <td>Vercel, Inc.</td>
            <td>Hosting, content delivery and cookie-free website statistics</td>
            <td>
              United States (EU-US Data Privacy Framework, with standard contractual
              clauses as fallback), with edge servers worldwide
            </td>
          </tr>
          <tr>
            <td>Stripe Payments Europe, Ltd.</td>
            <td>Payments, invoices and VAT for Pro</td>
            <td>Ireland and United States (Data Privacy Framework)</td>
          </tr>
          <tr>
            <td>Google LLC</td>
            <td>Sign in with Google; Google Calendar, if you subscribe to your calendar feed</td>
            <td>United States (Data Privacy Framework)</td>
          </tr>
          <tr>
            <td>OpenRouter, Inc. and OpenAI</td>
            <td>AI drafting and lead capture (section 5)</td>
            <td>United States (standard contractual clauses)</td>
          </tr>
          <tr>
            <td>Resend (Plus Five Five, Inc.)</td>
            <td>Sending sign-in codes and service emails</td>
            <td>United States (Data Privacy Framework)</td>
          </tr>
        </tbody>
      </table>
      <p>
        We may also disclose data when the law requires it, to defend our rights, or to a
        successor if the business changes hands, in which case this policy continues to
        apply.
      </p>

      <h2>7. International transfers</h2>
      <p>
        Your database and files are stored in the European Union. Some providers above
        process data in the United States. Where they do, the transfer relies on their
        certification under the EU-US Data Privacy Framework or on the European
        Commission’s standard contractual clauses, as noted in the table. You can ask us for
        a copy of the safeguards.
      </p>

      <h2>8. Cookies and storage on your device</h2>
      <p>
        {SITE_NAME} uses only the cookies it needs to work and to remember your choices, so it
        shows no cookie banner. Nothing on this site tracks you across other websites.
      </p>
      <table>
        <thead>
          <tr>
            <th scope="col">Name</th>
            <th scope="col">Purpose</th>
            <th scope="col">Duration</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>sb-… (Supabase)</td>
            <td>Keeps you signed in</td>
            <td>Refreshed while you use the service; up to 400 days</td>
          </tr>
          <tr>
            <td>NEXT_LOCALE</td>
            <td>Remembers your language</td>
            <td>One year</td>
          </tr>
          <tr>
            <td>sidebar_state</td>
            <td>Remembers whether the sidebar is open</td>
            <td>Seven days</td>
          </tr>
          <tr>
            <td>lw_ref</td>
            <td>Remembers the invite link you arrived from, so the referral is credited</td>
            <td>30 minutes</td>
          </tr>
        </tbody>
      </table>
      <p>
        When you install {SITE_NAME} on your phone, the browser also keeps a copy of recently
        opened pages so they stay readable offline. You can remove all of this at any time by
        clearing the site’s data in your browser or uninstalling the app.
      </p>
      <p>
        Website statistics come from Vercel Web Analytics, which sets no cookies and stores
        nothing on your device: it counts page views with a hashed identifier that is
        discarded within a day.
      </p>

      <h2>9. Your rights</h2>
      <p>
        You can ask us to access, correct, delete or export your data, to restrict or object
        to how we use it, and to withdraw any consent you have given. Write to {e.email}. We
        may ask you to confirm your identity, and we answer within one month.
      </p>
      <p>
        You can delete clients, documents and analyses yourself at any time. To close your
        account, email us: we delete your data within 30 days, except what we must keep by
        law (section 10).
      </p>
      <p>
        If you believe we have not handled your data properly, you can complain to the
        Spanish Data Protection Agency (Agencia Española de Protección de Datos, C/ Jorge
        Juan 6, 28001 Madrid,{" "}
        <a href="https://www.aepd.es" target="_blank" rel="noreferrer">
          www.aepd.es
        </a>
        ), or to the supervisory authority where you live.
      </p>

      <h2>10. How long we keep data</h2>
      <ul>
        <li>
          Your account and everything in it: while your account is open, and for up to 30
          days after you ask us to close it. Downgrading from Pro to Free deletes nothing.
        </li>
        <li>
          Invoices and payment records: six years, as Spanish commercial and tax law
          requires, blocked and used for nothing else.
        </li>
        <li>Server logs: up to 30 days.</li>
        <li>Backups: overwritten on our provider’s normal cycle, within 30 days of deletion.</li>
      </ul>

      <h2>11. Security</h2>
      <p>
        Data travels encrypted (TLS) and is stored encrypted at rest. Each agent’s data is
        separated by row-level security in the database; server-side keys never reach the
        browser; card details are handled entirely by Stripe. Access to production is
        limited to what running the service requires. No system is perfectly secure: if a
        breach affects you we will tell you, and the Spanish Data Protection Agency, as the
        law requires.
      </p>

      <h2>12. Minors</h2>
      <p>
        {SITE_NAME} is a professional tool for adults. We do not knowingly hold accounts for
        anyone under 18.
      </p>

      <h2>13. Changes</h2>
      <p>
        We will post any new version here with its date. If a change affects you materially
        we will email you before it takes effect.
      </p>
    </>
  );
}
