import type { ReactNode } from "react";

/**
 * Where Home's sections sit. The page fills the slots with streamed sections
 * and loading.tsx fills them with skeletons, so the two cannot drift apart.
 */
export function HomeLayout({
  notice,
  header,
  summary,
  attention,
  tasks,
  upcoming,
  recent,
}: {
  /** A one-off line above everything, such as how a referral link went. */
  notice?: ReactNode;
  header: ReactNode;
  summary: ReactNode;
  attention: ReactNode;
  /** Due tasks, stacked under attention in the left column. */
  tasks: ReactNode;
  upcoming: ReactNode;
  recent: ReactNode;
}) {
  return (
    <div className="space-y-5">
      {notice}
      {header}
      {summary}
      <div className="grid gap-5 lg:grid-cols-5">
        <div className="flex min-w-0 flex-col gap-5 lg:col-span-3">
          {attention}
          {tasks}
        </div>
        <div className="min-w-0 lg:col-span-2">{upcoming}</div>
      </div>
      {recent}
    </div>
  );
}
