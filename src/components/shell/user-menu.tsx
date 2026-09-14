"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import {
  Check,
  CircleQuestionMark,
  CreditCard,
  Gift,
  Languages,
  LogOut,
  Monitor,
  Moon,
  Sun,
} from "lucide-react";

import { signOut } from "@/lib/actions/auth";
import { LOCALES, LOCALE_LABELS, isLocale } from "@/i18n/config";
import { initialsOf } from "@/lib/home";
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
 * opening a menu with theme, language, account pages and sign out. This is
 * the one place those settings live, so the sidebar stays about navigation.
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

  const display = name?.trim() || email.split("@")[0] || email;
  const initials = initialsOf(display) || "?";

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            aria-label={display}
            className="bg-card hover:bg-muted/60 focus-visible:ring-ring/50 flex h-8 items-center gap-2 rounded-full border pr-2.5 pl-0.5 text-xs font-medium transition-[color,background-color,scale] duration-150 outline-none focus-visible:ring-[3px] active:scale-[0.96] data-[state=open]:bg-muted/60"
          >
            <Avatar className="size-[26px]">
              <AvatarFallback className="bg-primary/12 text-primary text-[10px] font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <span className="hidden max-w-32 truncate sm:block">{display}</span>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" sideOffset={8} className="w-60">
          <DropdownMenuLabel className="flex flex-col gap-0.5 font-normal">
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
