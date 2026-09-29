import type { ReactNode } from "react";

/**
 * Where Home's sections sit. The page fills the slots with streamed sections
 * and loading.tsx fills them with skeletons, so the two cannot drift apart.
 * On a wide screen the day's work (Needs attention, then tasks) takes the
 * left, and what's next and who was touched last take the right. On a phone
 * the day's work comes first and the figures move below it (the figures
 * carry their own phone order). The getting-started strip is one 44px line,
 * so it stays under the greeting. The two columns' cards size to their rows
 * rather than stretching to match, so a short list never draws a tall empty
 * card.
 */
export function HomeLayout({
  notice,
  header,
  onboarding,
  summary,
  attention,
  tasks,
  upcoming,
  recent,
}: {
  /** A one-off line above everything, such as how a referral link went. */
  notice?: ReactNode;
  header: ReactNode;
  /** Getting started, for young accounts: a single line above the figures. */
  onboarding?: ReactNode;
  summary: ReactNode;
  attention: ReactNode;
  /** Due tasks, stacked under attention in the left column. */
  tasks: ReactNode;
  upcoming: ReactNode;
  /** Recent clients, under upcoming in the right column. */
  recent: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-5">
      {notice}
      {header}
      {onboarding}
      {summary}
      <div className="grid gap-5 max-md:order-1 lg:grid-cols-5">
        <div className="flex min-w-0 flex-col gap-5 lg:col-span-3">
          {attention}
          {tasks}
        </div>
        <div className="flex min-w-0 flex-col gap-5 lg:col-span-2">
          {upcoming}
          {recent}
        </div>
      </div>
    </div>
  );
}
