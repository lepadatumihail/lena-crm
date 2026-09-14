"use client";

import { useTheme } from "next-themes";
import { useTranslations } from "next-intl";
import { Moon, Sun } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * The theme and a setter, for the toggle and the account menu. The provider
 * mutes every transition while the class flips (`disableTransitionOnChange`),
 * so a switch snaps instead of smearing across the page.
 */
export function useThemeSwitch() {
  const { theme, resolvedTheme, setTheme } = useTheme();
  return { theme, resolvedTheme, switchTheme: setTheme };
}

/**
 * One icon button that flips between light and dark. Both icons are always
 * rendered and CSS picks the visible one, so the server and the client agree
 * on the markup before the theme is known.
 */
export function ThemeToggle({ className }: { className?: string }) {
  const t = useTranslations("nav");
  const { resolvedTheme, switchTheme } = useThemeSwitch();
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      aria-label={t("theme")}
      title={t("theme")}
      onClick={() => switchTheme(resolvedTheme === "dark" ? "light" : "dark")}
      className={cn("size-8", className)}
    >
      <Sun className="dark:hidden" />
      <Moon className="hidden dark:block" />
    </Button>
  );
}
