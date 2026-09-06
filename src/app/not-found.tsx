import Link from "next/link";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";

export default function NotFound() {
  const t = useTranslations("landing.notFound");

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 px-6 py-24 text-center">
      <div>
        <p className="text-primary text-sm font-semibold">404</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">
          {t("title")}
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">{t("body")}</p>
      </div>
      <Button asChild>
        <Link href="/clients">{t("cta")}</Link>
      </Button>
    </main>
  );
}
