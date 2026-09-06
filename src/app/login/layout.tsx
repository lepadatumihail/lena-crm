import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

// The sign-in page is public but has no place in search results: without its
// own tags it inherits the homepage's, and /login?next=... variants would be
// indexed as duplicates. The page is a client component, so metadata lives here.
export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("auth.login");
  return {
    title: t("meta.title"),
    robots: { index: false, follow: false },
  };
}

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
