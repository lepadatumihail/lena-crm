import type { ReactNode } from "react";

/**
 * Where Home's sections sit. The page fills the slots with streamed sections
 * and loading.tsx fills them with skeletons, so the two cannot drift apart.
 */
export function HomeLayout({
  header,
  summary,
  attention,
  upcoming,
  recent,
}: {
  header: ReactNode;
  summary: ReactNode;
  attention: ReactNode;
  upcoming: ReactNode;
  recent: ReactNode;
}) {
  return (
    <div className="space-y-5">
      {header}
      {summary}
      <div className="grid gap-5 lg:grid-cols-5">
        <div className="min-w-0 lg:col-span-3">{attention}</div>
        <div className="min-w-0 lg:col-span-2">{upcoming}</div>
      </div>
      {recent}
    </div>
  );
}
