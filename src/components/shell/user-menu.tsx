"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import {
  Check,
  CircleQuestionMark,
  CreditCard,
  Gift,
  Languages,
  ListChecks,
  LogOut,
  Monitor,
  Moon,
  Settings,
  Sun,
} from "lucide-react";

import { signOut } from "@/lib/actions/auth";
import { LOCALES, LOCALE_LABELS, isLocale } from "@/i18n/config";
import { initialsOf, onboardingCookie, onboardingState, readOnboardingCookie } from "@/lib/home";
import { useAgentId } from "@/components/shell/shell-context";
import { useSwitchLocale } from "@/components/locale-switcher";
import { SupportDialog } from "@/components/support-dialog";
import { useThemeSwitch } from "@/components/theme-toggle";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const THEMES = [
  { value: "light", icon: Sun, key: "light" },
  { value: "dark", icon: Moon, key: "dark" },
  { value: "system", icon: Monitor, key: "system" },
] as const;

/**
 * The signed-in agent as a chip at the top right: avatar and first name,
 * opening a menu with theme, language, settings, account pages and sign out.
 * Account things live here, so the sidebar stays about navigation. After
 * the agent has closed Home's getting-started strip, the menu offers it back.
 */
export function UserMenu({
  email,
  name,
}: {
  email: string;
  name: string | null;
}) {
  const t = useTranslations("nav");
  const tSupport = useTranslations("support");
  const locale = useLocale();
  const { theme, switchTheme } = useThemeSwitch();
  const { pending: localePending, switchTo } = useSwitchLocale();
  const [supportOpen, setSupportOpen] = useState(false);
  const [, startTransition] = useTransition();
  const router = useRouter();
  const pathname = usePathname();
  const agentId = useAgentId();
  // Read when the menu opens: the cookie lives in the browser, and reading it
  // during render would disagree with the server's HTML.
  const [onboardingHidden, setOnboardingHidden] = useState(false);

  const display = name?.trim() || email.split("@")[0] || email;
  const initials = initialsOf(display) || "?";

  function showOnboarding() {
    document.cookie = onboardingCookie(null);
    setOnboardingHidden(false);
    if (pathname === "/home") router.refresh();
    else router.push("/home");
  }

  return (
    <>
      <DropdownMenu
        onOpenChange={(open) => {
          if (open) {
            setOnboardingHidden(
              onboardingState(readOnboardingCookie(document.cookie), agentId) === "hidden"
            );
          }
        }}
      >
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            aria-label={display}
            className="bg-card hover:bg-muted/60 focus-visible:ring-ring/50 flex h-8 items-center gap-2 rounded-lg border px-[3px] text-xs transition-[color,background-color,scale] duration-150 outline-none focus-visible:ring-[3px] active:scale-[0.96] data-[state=open]:bg-muted/60 sm:pr-2.5"
          >
            {/* An even 3px round the avatar, so the circle sits squarely in
                the rounded square; on a phone the chip is the avatar alone. */}
            <Avatar className="size-6">
              <AvatarFallback className="bg-muted text-foreground/80 text-[10px] font-medium">
                {initials}
              </AvatarFallback>
            </Avatar>
            <span className="hidden max-w-32 truncate sm:block">{display}</span>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" sideOffset={8} className="w-60">
          <DropdownMenuLabel className="flex flex-col gap-0.5">
            <span className="truncate text-sm font-medium">{display}</span>
            <span className="text-muted-foreground truncate text-xs">{email}</span>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />

          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <Sun className="dark:hidden" />
              <Moon className="hidden dark:block" />
              {t("menu.theme")}
            </DropdownMenuSubTrigger>
            <DropdownMenuPortal>
              <DropdownMenuSubContent>
                <DropdownMenuRadioGroup
                  value={theme ?? "system"}
                  onValueChange={switchTheme}
                >
                  {THEMES.map((option) => (
                    <DropdownMenuRadioItem
                      key={option.value}
                      value={option.value}
                    >
                      <option.icon className="text-muted-foreground size-4" />
                      {t(`menu.${option.key}`)}
                    </DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
              </DropdownMenuSubContent>
            </DropdownMenuPortal>
          </DropdownMenuSub>

          <DropdownMenuSub>
            <DropdownMenuSubTrigger disabled={localePending}>
              <Languages />
              {t("menu.language")}
              <span className="text-muted-foreground ml-auto text-xs uppercase">
                {locale}
              </span>
            </DropdownMenuSubTrigger>
            <DropdownMenuPortal>
              <DropdownMenuSubContent>
                {LOCALES.map((l) => (
                  <DropdownMenuItem
                    key={l}
                    onSelect={() => {
                      if (isLocale(l) && l !== locale) switchTo(l);
                    }}
                  >
                    <span className="w-4">
                      {l === locale ? <Check className="size-4" /> : null}
                    </span>
                    {LOCALE_LABELS[l]}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuSubContent>
            </DropdownMenuPortal>
          </DropdownMenuSub>

          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link href="/settings">
              <Settings />
              {t("settings")}
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/billing">
              <CreditCard />
              {t("billing")}
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/referrals">
              <Gift />
              {t("referrals")}
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => setSupportOpen(true)}>
            <CircleQuestionMark />
            {tSupport("trigger")}
          </DropdownMenuItem>
          {onboardingHidden ? (
            <DropdownMenuItem onSelect={showOnboarding}>
              <ListChecks />
              {t("menu.showOnboarding")}
            </DropdownMenuItem>
          ) : null}

          <DropdownMenuSeparator />
          <DropdownMenuItem
            onSelect={() => startTransition(() => signOut())}
          >
            <LogOut />
            {t("signOut")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <SupportDialog
        open={supportOpen}
        onOpenChange={setSupportOpen}
        email={email}
      />
    </>
  );
}
