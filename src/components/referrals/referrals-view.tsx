import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { ArrowRight, Gift, Link2, Sparkles, Users } from "lucide-react";

import { CopyButton } from "@/components/referrals/copy-button";
import { RowIcon } from "@/components/shell/key-value";
import { Panel, PanelEmpty } from "@/components/shell/panel";
import { Button } from "@/components/ui/button";
import { Tag } from "@/components/ui/tag";
import { intlTag } from "@/i18n/config";
import { planState } from "@/lib/access";
import { FOUNDING_CAP, PRICES, foundingSpotsLeft } from "@/lib/billing";
import type { ReferralOverview } from "@/lib/data/referrals";
import { initialsOf } from "@/lib/home";
import {
  REFERRAL_STATE_KEY,
  type ReferralState,
  formatReferralCode,
} from "@/lib/referrals/links";
import { TONE_BG, TONE_INK, type Tone } from "@/lib/tones";
import { cn } from "@/lib/utils";

/** A referral moves through the same hues as a lead: new, in progress, won. */
const STATE_TONE: Record<ReferralState, Tone> = {
  signed_up: "blue",
  subscribed: "teal",
  rewarded: "green",
  left: "neutral",
};

/**
 * Referrals on the shell's panels: the link to share beside the free months
 * it has earned, the agents who used it, and the founding offer underneath.
 */
export function ReferralsView({ overview }: { overview: ReferralOverview }) {
  const t = useTranslations("referrals");
  const tag = intlTag(useLocale());
  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString(tag, { day: "numeric", month: "short" });
  const { profile, referralUrl, referred, monthsEarned, unappliedCreditEur, referredBy, founderCount } =
    overview;
  const isFounder = profile?.founding_number != null;
  const spotsLeft = foundingSpotsLeft(founderCount);
  const plan = planState(profile);

  const foundingTitle = isFounder
    ? t("founding.youAre", { number: profile?.founding_number ?? 0 })
    : spotsLeft > 0
      ? t("founding.spots", { count: spotsLeft })
      : t("founding.full");
  const foundingBody = isFounder
    ? spotsLeft > 0
      ? t("founding.lockedWithSpots", { count: spotsLeft })
      : t("founding.lockedFull")
    : spotsLeft > 0
      ? t("founding.offer", {
          cap: FOUNDING_CAP,
          price: PRICES.founding.monthly,
          standard: PRICES.standard.monthly,
        })
      : t("founding.standard", { price: PRICES.standard.monthly });

  return (
    <div className="space-y-4">

      <div className="grid items-start gap-4 lg:grid-cols-3">
        <Panel
          className="lg:col-span-2"
          title={t("link.title")}
          icon={<Link2 className="size-3.5" />}
          footer={t("link.description")}
        >
          <div className="space-y-4 px-4 py-5">
            <p className="max-w-2xl text-sm text-pretty">{t("subtitle")}</p>
            {profile && referralUrl ? (
              <div className="bg-muted/40 flex flex-col gap-3 rounded-lg border px-3.5 py-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="font-mono text-sm font-medium tracking-wider">
                    {formatReferralCode(profile.referral_code)}
                  </p>
                  <p className="text-muted-foreground truncate text-xs">{referralUrl}</p>
                </div>
                <CopyButton text={referralUrl} />
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">{t("link.pending")}</p>
            )}
          </div>
        </Panel>

        <Panel
          title={t("rewards.title")}
          icon={<Gift className="size-3.5" />}
          footer={t("rewards.description")}
        >
          <div className="space-y-2 px-4 py-5">
            <p className="flex items-baseline gap-2">
              <span className="text-3xl leading-none font-semibold tracking-tight tabular-nums">
                {monthsEarned}
              </span>
              <span className="text-muted-foreground text-sm">
                {t("rewards.earnedLabel", { count: monthsEarned })}
              </span>
            </p>
            <div className="text-muted-foreground space-y-1 text-[13px] text-pretty">
              {monthsEarned === 0 ? <p>{t("rewards.none")}</p> : null}
              {plan.source === "comp" && plan.proUntil ? (
                <p>{t("rewards.proUntil", { date: formatDate(plan.proUntil) })}</p>
              ) : null}
              {unappliedCreditEur > 0 ? (
                <p>{t("rewards.credit", { amount: unappliedCreditEur })}</p>
              ) : null}
              {referredBy ? (
                <p>
                  {t("rewards.referredBy", { name: referredBy.name || referredBy.email || "" })}
                </p>
              ) : null}
            </div>
          </div>
        </Panel>
      </div>

      <Panel
        title={t("agents.title")}
        icon={<Users className="size-3.5" />}
        count={referred.length}
        footer={t("agents.description")}
      >
        {referred.length === 0 ? (
          <PanelEmpty>{t("agents.empty")}</PanelEmpty>
        ) : (
          <ul className="divide-y">
            {referred.map((agent) => {
              const name = agent.name || agent.email || t("agents.anonymous");
              return (
                <li key={agent.id} className="flex items-center gap-3 px-4 py-2.5">
                  <span
                    aria-hidden
                    className="bg-muted text-muted-foreground flex size-8 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold uppercase ring-1 ring-black/[0.06] ring-inset dark:ring-white/10"
                  >
                    {initialsOf(name)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{name}</p>
                    <p className="text-muted-foreground truncate text-xs">
                      {agent.paidInvoices > 0
                        ? t("agents.joinedWithPaid", {
                            date: formatDate(agent.joinedAt),
                            count: agent.paidInvoices,
                          })
                        : t("agents.joined", { date: formatDate(agent.joinedAt) })}
                    </p>
                  </div>
                  <Tag tone={STATE_TONE[agent.state]} dot>
                    {t(REFERRAL_STATE_KEY[agent.state])}
                  </Tag>
                </li>
              );
            })}
          </ul>
        )}
      </Panel>

      <Panel>
        <div className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center">
          <RowIcon icon={Sparkles} className={cn("mt-0", TONE_BG.amber, TONE_INK.amber)} />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium">{foundingTitle}</p>
            <p className="text-muted-foreground text-[13px] text-pretty">{foundingBody}</p>
          </div>
          {!isFounder && plan.source !== "subscription" ? (
            <Button asChild size="sm" className="self-start rounded-full sm:self-center">
              <Link href="/pricing">
                {t("founding.seePlans")} <ArrowRight />
              </Link>
            </Button>
          ) : null}
        </div>
      </Panel>
    </div>
  );
}
