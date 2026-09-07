"use client";

import { useTheme } from "next-themes";
import { useTranslations } from "next-intl";
import { Moon, Sun } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * One icon button that flips between light and dark. Both icons are always
 * rendered and CSS picks the visible one, so the server and the client agree
 * on the markup before the theme is known.
 */
export function ThemeToggle({ className }: { className?: string }) {
  const t = useTranslations("nav");
  const { resolvedTheme, setTheme } = useTheme();
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      aria-label={t("theme")}
      title={t("theme")}
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
      className={cn("size-8", className)}
    >
      <Sun className="dark:hidden" />
      <Moon className="hidden dark:block" />
    </Button>
  );
}
