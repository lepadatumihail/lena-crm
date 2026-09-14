import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { ArrowRight, Gift, Link2, Sparkles, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Notice } from "@/components/ui/notice";
import { Tag } from "@/components/ui/tag";
import { CopyButton } from "@/components/referrals/copy-button";
import { intlTag } from "@/i18n/config";
import { planState } from "@/lib/access";
import { FOUNDING_CAP, PRICES, foundingSpotsLeft } from "@/lib/billing";
import type { ReferralOverview } from "@/lib/data/referrals";
import {
  REFERRAL_STATE_KEY,
  type ReferralState,
  claimMessage,
  formatReferralCode,
} from "@/lib/referrals/links";
import type { Tone } from "@/lib/tones";

/** A referral moves through the same hues as a lead: new, in progress, won. */
const STATE_TONE: Record<ReferralState, Tone> = {
  signed_up: "blue",
  subscribed: "teal",
  rewarded: "green",
  left: "neutral",
};

const MESSAGE_TONE: Record<"success" | "info" | "error", Tone> = {
  success: "green",
  info: "neutral",
  error: "red",
};

export function ReferralsView({
  overview,
  claimed,
}: {
  overview: ReferralOverview;
  claimed?: string;
}) {
  const t = useTranslations("referrals");
  const tag = intlTag(useLocale());
  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString(tag, { day: "numeric", month: "short" });
  const { profile, referralUrl, referred, monthsEarned, unappliedCreditEur, referredBy, founderCount } =
    overview;
  const message = claimMessage(claimed);
  const isFounder = profile?.founding_number != null;
  const spotsLeft = foundingSpotsLeft(founderCount);
  const plan = planState(profile);

  return (
    <div className="space-y-6">
      <p className="text-muted-foreground max-w-2xl text-sm">{t("subtitle")}</p>

      {message ? (
        <Notice tone={MESSAGE_TONE[message.tone]}>{t(message.key)}</Notice>
      ) : null}

      {/* Founding */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="text-primary size-4" />
            {isFounder
              ? t("founding.youAre", { number: profile?.founding_number ?? 0 })
              : spotsLeft > 0
                ? t("founding.spots", { count: spotsLeft })
                : t("founding.full")}
          </CardTitle>
          <CardDescription>
            {isFounder
              ? spotsLeft > 0
                ? t("founding.lockedWithSpots", { count: spotsLeft })
                : t("founding.lockedFull")
              : spotsLeft > 0
                ? t("founding.offer", {
                    cap: FOUNDING_CAP,
                    price: PRICES.founding.monthly,
                    standard: PRICES.standard.monthly,
                  })
                : t("founding.standard", { price: PRICES.standard.monthly })}
          </CardDescription>
        </CardHeader>
        {!isFounder && plan.source !== "subscription" ? (
          <CardContent>
            <Button asChild>
              <Link href="/pricing">
                {t("founding.seePlans")} <ArrowRight />
              </Link>
            </Button>
          </CardContent>
        ) : null}
      </Card>

      {/* Link */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link2 className="text-primary size-4" />
            {t("link.title")}
          </CardTitle>
          <CardDescription>{t("link.description")}</CardDescription>
        </CardHeader>
        <CardContent>
          {profile && referralUrl ? (
            <div className="flex flex-col gap-3 rounded-lg border px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <div className="font-mono text-sm font-medium tracking-wider">
                  {formatReferralCode(profile.referral_code)}
                </div>
                <div className="text-muted-foreground truncate text-xs">{referralUrl}</div>
              </div>
              <CopyButton text={referralUrl} />
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">{t("link.pending")}</p>
          )}
        </CardContent>
      </Card>

      {/* Referred agents */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="text-primary size-4" />
            {t("agents.title")}
          </CardTitle>
          <CardDescription>{t("agents.description")}</CardDescription>
        </CardHeader>
        <CardContent>
          {referred.length === 0 ? (
            <p className="text-muted-foreground text-sm">{t("agents.empty")}</p>
          ) : (
            <ul className="divide-y rounded-lg border">
              {referred.map((agent) => (
                <li
                  key={agent.id}
                  className="flex items-center justify-between gap-3 px-4 py-3"
                >
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium">
                      {agent.name || agent.email || t("agents.anonymous")}
                    </div>
                    <div className="text-muted-foreground text-xs">
                      {agent.paidInvoices > 0
                        ? t("agents.joinedWithPaid", {
                            date: formatDate(agent.joinedAt),
                            count: agent.paidInvoices,
                          })
                        : t("agents.joined", { date: formatDate(agent.joinedAt) })}
                    </div>
                  </div>
                  <Tag tone={STATE_TONE[agent.state]} dot>
                    {t(REFERRAL_STATE_KEY[agent.state])}
                  </Tag>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* Rewards */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="text-primary size-4" />
            {t("rewards.title")}
          </CardTitle>
          <CardDescription>{t("rewards.description")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-1 text-sm">
          {monthsEarned > 0 ? (
            <p>
              <span className="font-medium">{t("rewards.earned", { count: monthsEarned })}</span>
            </p>
          ) : (
            <p className="text-muted-foreground">{t("rewards.none")}</p>
          )}
          {plan.source === "comp" && plan.proUntil ? (
            <p className="text-muted-foreground">
              {t("rewards.proUntil", { date: formatDate(plan.proUntil) })}
            </p>
          ) : null}
          {unappliedCreditEur > 0 ? (
            <p className="text-muted-foreground">
              {t("rewards.credit", { amount: unappliedCreditEur })}
            </p>
          ) : null}
          {referredBy ? (
            <p className="text-muted-foreground">
              {t("rewards.referredBy", { name: referredBy.name || referredBy.email || "" })}
            </p>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
