"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("common");
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 py-24 text-center">
      <div>
        <h2 className="text-lg font-semibold">{t("errors.generic")}</h2>
        <p className="text-muted-foreground mt-1 text-sm">
          {t("errors.unexpected")}
        </p>
      </div>
      <Button onClick={reset}>{t("retry")}</Button>
    </div>
  );
}
