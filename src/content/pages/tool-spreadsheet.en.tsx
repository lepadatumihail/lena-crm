import Link from "next/link";

import type { MarketingPageContent } from "@/components/marketing/marketing-page";
import { TrackerDownload } from "@/components/tools/tracker-download";
import { FREE_CLIENT_LIMIT } from "@/lib/access";
import { STALE_AFTER_DAYS } from "@/lib/attention";
import { marketingPath } from "@/lib/routes";
import { SITE_NAME } from "@/lib/site";
import { TRACKER_IMPORT_PATH, XLSX_TYPE, trackerPath } from "@/lib/tools/tracker-files";

const PUBLISHED_ON = "2026-09-29";
const home = marketingPath("home", "en");

function Tracker() {
  return <TrackerDownload locale="en" asOf={PUBLISHED_ON} />;
}

function Body() {
  return (
    <>
      <h2>What&apos;s in the file</h2>
      <p>
        Three sheets. Buyers and Sellers hold one client per row, under the same headers{" "}
        {SITE_NAME} uses, so when you import the file every column is matched for you. How to use
        has the short version of this page and the words columns like Stage and Priority take.
      </p>
      <p>The Buyers sheet has these columns:</p>
      <dl>
        <dt>The client</dt>
        <dd>
          First name, Last name, Email, Phone, Language, Nationality and Agency: the agency the
          lead came through, when you work with more than one.
        </dd>
        <dt>Where they are</dt>
        <dd>
          Stage (New, Contacted, Qualified, Viewing or Reserved), Deal type (Direct or
          Collaboration), Priority and Active.
        </dd>
        <dt>What they want</dt>
        <dd>Budget min and max, Property types, Bedrooms, Bathrooms and Area notes.</dd>
        <dt>Your follow-up</dt>
        <dd>
          Notes, Last contact, Next follow-up and Days since contact, which works itself out
          from Last contact.
        </dd>
      </dl>
      <p>
        The Sellers sheet swaps the search for the property: Role (Owner or Representative),
        Property type, Price, Bedrooms, Address, City / area and Property notes. A seller with
        two properties takes two rows, and {SITE_NAME} joins them into one client when you import.
      </p>

      <h2>How the colours work</h2>
      <p>
        Two dates drive the colours. When you speak to a client, put the date in Last contact.
        When you should get back to them, put that date in Next follow-up.
      </p>
      <ul>
        <li>
          A row turns amber on the day its Next follow-up comes round, and stays amber until you
          change the date. Those are today&apos;s calls.
        </li>
        <li>
          A row turns grey once Days since contact reaches {STALE_AFTER_DAYS}: a week without a
          word, the point at which {SITE_NAME} itself flags a buyer as gone quiet.
        </li>
        <li>A row that is both stays amber, because a follow-up that is due matters more.</li>
      </ul>
      <p>Nothing needs refreshing: the colours read today&apos;s date whenever the file is open.</p>

      <h2>Excel, Google Sheets or Numbers</h2>
      <p>The file is an ordinary .xlsx workbook.</p>
      <ul>
        <li>
          <strong>Excel</strong>, on Windows, on a Mac or on the web, opens it as it is, with the
          colours and the day count working. Type dates year first, like 2026-09-29, or the way
          your Excel usually takes them; the tracker shows them year first.
        </li>
        <li>
          <strong>Google Sheets</strong>: upload the file to Google Drive and open it with Google
          Sheets, or start a blank sheet and use File → Import. The colours and the day count come
          along.
        </li>
        <li>
          <strong>Numbers</strong> opens it too, with your data and the day count. Numbers
          handles colour rules its own way, so the rows may stay white there.
        </li>
      </ul>

      <h2>When a spreadsheet stops being enough</h2>
      <p>
        A spreadsheet is a fine place to start, and plenty of agents run on one for years. It
        has limits, though, and they show as the list grows:
      </p>
      <ul>
        <li>
          It can&apos;t remind you. The amber only shows when you open the file; nothing on your
          phone tells you a follow-up is due.
        </li>
        <li>
          It doesn&apos;t write anything. Every follow-up still starts from a blank message, in
          whatever language the client speaks.
        </li>
        <li>
          It lives in one place. A copy on the laptop and another on the phone drift apart, and
          viewings, offers and documents end up in the Notes column.
        </li>
      </ul>

      <h2>Moving it into {SITE_NAME}</h2>
      <p>
        <Link href={home}>{SITE_NAME}</Link> is a CRM for independent estate agents in Spain,
        and this file is its import template with a tracker around it. Moving takes three steps:
      </p>
      <ol>
        <li>
          {/* An explicit space: SWC drops the leading space of a text that spans
              lines and holds an entity such as &apos; (Next 16.2.6). */}
          <strong>Sign in</strong>{" "}with Google or a code by email. There&apos;s no password to
          invent.
        </li>
        <li>
          <strong>Upload the file.</strong> Open Buyers, choose Import from a spreadsheet and pick
          the Buyers sheet. Every column is matched already: you see a preview, and you can undo
          the whole import with one click. Then do the same in Sellers with the Sellers sheet.
        </li>
        <li>
          <strong>Send the first follow-up.</strong> Open a buyer who has gone quiet. The message
          is already drafted in their language, for you to read, tweak and send.
        </li>
      </ol>
      <p>
        Last contact and Next follow-up come in as lines in each client&apos;s notes, and Days
        since contact is left out. From then on, each contact you log in {SITE_NAME}{" "}keeps that
        date for you. It&apos;s free for up to {FREE_CLIENT_LIMIT} clients.
      </p>
    </>
  );
}

export const content: MarketingPageContent = {
  title: "Free client tracker spreadsheet for estate agents",
  description:
    "A free Excel spreadsheet to track your buyers and sellers: follow-ups due in amber, quiet clients in grey, and columns that import straight into LeadWing.",
  kind: "tool",
  published: PUBLISHED_ON,
  eyebrow: "Free tool",
  heading: "A free spreadsheet to track your buyers and sellers",
  lead: "Buyers and sellers in one Excel file, with the follow-ups that are due in amber and the clients going quiet in grey. Download it, no email needed.",
  Body,
  faq: [
    {
      q: "Is the client tracker spreadsheet free?",
      a: "Yes. Download it without an account or an email address, and use it for as long as you like. It's an Excel file you keep, not a trial.",
    },
    {
      q: "Does it work in Google Sheets?",
      a: "Yes. Upload the file to Google Drive and open it with Google Sheets, or use File → Import in a blank sheet. The colours and the day count come along.",
    },
    {
      q: "Can I add my own columns?",
      a: "Yes, as many as you need. When you import the file into LeadWing, each extra column comes in as a line in the client's notes.",
    },
    {
      q: "How do I import it into LeadWing?",
      a: "Sign in, open Buyers, choose Import from a spreadsheet and pick the Buyers sheet: every column is matched already. Do the same in Sellers with the Sellers sheet. You see a preview first, and you can undo the import in one click.",
    },
    {
      q: "What do the colours mean?",
      a: `Amber means the Next follow-up date is today or has passed, so that client is waiting for you. Grey means ${STALE_AFTER_DAYS} days or more have gone by since the Last contact date. When both apply, the row stays amber.`,
    },
  ],
  related: ["toolCommission", "guideFollowUp", "pricing"],
  tool: {
    Component: Tracker,
    schema: {
      "@type": "SpreadsheetDigitalDocument",
      encodingFormat: XLSX_TYPE,
      contentPath: trackerPath("en"),
    },
    next: TRACKER_IMPORT_PATH,
  },
};
