"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  Loader2,
  Monitor,
  Moon,
  SlidersHorizontal,
  Sun,
  UserRound,
} from "lucide-react";

import { useSwitchLocale } from "@/components/locale-switcher";
import { TimeZonePicker } from "@/components/settings/time-zone-picker";
import { Panel } from "@/components/shell/panel";
import { Segmented } from "@/components/shell/toolbar";
import { useThemeSwitch } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useHydrated } from "@/hooks/use-hydrated";
import { LOCALES, LOCALE_LABELS, intlTag, isLocale } from "@/i18n/config";
import { saveSettings } from "@/lib/actions/settings";
import { formatTimeInTimeZone } from "@/lib/attention";
import { isValidTimeZone, timeZoneCity } from "@/lib/time-zones";
import {
  NAME_MAX,
  settingsFormSchema,
  type SettingsFormValues,
} from "@/lib/validation/settings";

/* One setting per row: what it is on the left, the control on the right. */
const ROW =
  "grid gap-x-10 gap-y-3 px-4 py-4 md:grid-cols-[minmax(0,16rem)_minmax(0,1fr)]";

/**
 * The agent's settings on two panels. Name and time zone are saved together;
 * language and theme apply the moment they change, as in the account menu.
 */
export function SettingsView({
  email,
  fullName,
  timeZone,
}: {
  email: string;
  fullName: string;
  timeZone: string;
}) {
  const t = useTranslations("settings");
  const tv = useTranslations("validation");
  const schema = useMemo(() => settingsFormSchema(tv), [tv]);
  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { full_name: fullName, time_zone: timeZone },
  });
  const [saving, startSaving] = useTransition();
  const dirty = form.formState.isDirty;

  function onSubmit(values: SettingsFormValues) {
    startSaving(async () => {
      const { error } = await saveSettings(values);
      if (error) {
        toast.error(t("profile.saveFailed"), { description: error });
        return;
      }
      form.reset(values);
      toast.success(t("profile.saved"));
    });
  }

  return (
    <div className="mx-auto w-full max-w-3xl space-y-4">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
          <Panel
            title={t("profile.title")}
            icon={<UserRound className="size-3.5" />}
            footer={
              <>
                <span aria-live="polite">{dirty ? t("profile.unsaved") : null}</span>
                <Button
                  type="submit"
                  size="sm"
                  className="ml-auto"
                  disabled={saving || !dirty}
                >
                  {saving ? <Loader2 className="animate-spin" /> : null}
                  {t("profile.save")}
                </Button>
              </>
            }
          >
            <div className="divide-y">
              <FormField
                control={form.control}
                name="full_name"
                render={({ field }) => (
                  <FormItem className={ROW}>
                    <div className="space-y-1.5">
                      <FormLabel>{t("profile.name")}</FormLabel>
                      <FormDescription className="text-[13px] text-pretty">
                        {t("profile.nameHint")}
                      </FormDescription>
                    </div>
                    <div className="space-y-1.5 md:max-w-sm">
                      <FormControl>
                        <Input
                          autoComplete="name"
                          maxLength={NAME_MAX}
                          placeholder={t("profile.namePlaceholder")}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </div>
                  </FormItem>
                )}
              />

              <div className={ROW}>
                <SettingText label={t("profile.email")} hint={t("profile.emailHint")} />
                <p className="flex h-9 min-w-0 items-center text-sm md:max-w-sm">
                  <span className="truncate">{email}</span>
                </p>
              </div>

              <FormField
                control={form.control}
                name="time_zone"
                render={({ field }) => (
                  <FormItem className={ROW}>
                    <div className="space-y-1.5">
                      <FormLabel>{t("profile.timeZone")}</FormLabel>
                      <FormDescription className="text-[13px] text-pretty">
                        {t("profile.timeZoneHint")}
                      </FormDescription>
                    </div>
                    <div className="space-y-1.5 md:max-w-sm">
                      <FormControl>
                        <TimeZonePicker value={field.value} onChange={field.onChange} />
                      </FormControl>
                      <ZoneFootnote
                        zone={field.value}
                        onUseDevice={(zone) =>
                          form.setValue("time_zone", zone, { shouldDirty: true })
                        }
                      />
                      <FormMessage />
                    </div>
                  </FormItem>
                )}
              />
            </div>
          </Panel>
        </form>
      </Form>

      <PreferencesPanel />
    </div>
  );
}

function SettingText({ label, hint }: { label: string; hint: string }) {
  return (
    <div className="space-y-1.5">
      <p className="text-sm leading-none font-medium">{label}</p>
      <p className="text-muted-foreground text-[13px] text-pretty">{hint}</p>
    </div>
  );
}

/**
 * Under the time zone: the time there now, and a one-tap switch to this
 * device's zone when it differs. Both need the browser, so they wait for
 * hydration.
 */
function ZoneFootnote({
  zone,
  onUseDevice,
}: {
  zone: string;
  onUseDevice: (zone: string) => void;
}) {
  const t = useTranslations("settings.profile");
  const tag = intlTag(useLocale());
  const hydrated = useHydrated();
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);

  if (!hydrated) return <p aria-hidden className="h-4" />;
  const device = Intl.DateTimeFormat().resolvedOptions().timeZone;
  return (
    <p className="text-muted-foreground flex min-h-4 flex-wrap items-center gap-x-3 gap-y-1 text-xs">
      <span className="tabular-nums">
        {t("localTime", { time: formatTimeInTimeZone(now.toISOString(), zone, tag) })}
      </span>
      {isValidTimeZone(device) && device !== zone ? (
        <button
          type="button"
          onClick={() => onUseDevice(device)}
          className="text-primary font-medium hover:underline"
        >
          {t("useDevice", { zone: timeZoneCity(device) })}
        </button>
      ) : null}
    </p>
  );
}

function PreferencesPanel() {
  const t = useTranslations("settings.preferences");
  const tMenu = useTranslations("nav.menu");
  const locale = useLocale();
  const hydrated = useHydrated();
  const { theme, switchTheme } = useThemeSwitch();
  const { switchTo } = useSwitchLocale();

  return (
    <Panel title={t("title")} icon={<SlidersHorizontal className="size-3.5" />}>
      <div className="divide-y">
        <div className={ROW}>
          <SettingText label={t("language")} hint={t("languageHint")} />
          <div>
            <Segmented
              label={t("language")}
              value={locale}
              onChange={(next) => {
                if (isLocale(next) && next !== locale) switchTo(next);
              }}
              items={LOCALES.map((l) => ({ value: l, label: LOCALE_LABELS[l] }))}
            />
          </div>
        </div>
        <div className={ROW}>
          <SettingText label={t("theme")} hint={t("themeHint")} />
          <div>
            {/* The stored theme is unknown on the server, so nothing is marked until hydration. */}
            <Segmented
              label={t("theme")}
              value={hydrated ? (theme ?? "system") : ""}
              onChange={switchTheme}
              items={[
                { value: "light", label: tMenu("light"), icon: <Sun /> },
                { value: "dark", label: tMenu("dark"), icon: <Moon /> },
                { value: "system", label: tMenu("system"), icon: <Monitor /> },
              ]}
            />
          </div>
        </div>
      </div>
    </Panel>
  );
}
