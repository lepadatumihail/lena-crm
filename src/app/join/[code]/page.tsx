import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { ArrowRight, Check } from "lucide-react";

import { MarketingNav } from "@/components/marketing-nav";
import { LogoMark } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { findInviterByCode, getFounderCount } from "@/lib/referrals/engine";
import { isValidReferralCode, normalizeReferralCode } from "@/lib/referrals/links";
import { FOUNDING_CAP, PRICES, foundingSpotsLeft } from "@/lib/billing";
import { FREE_CLIENT_LIMIT } from "@/lib/access";
import { SITE_NAME } from "@/lib/site";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("auth.join");
  return {
    title: t("meta.title"),
    robots: { index: false, follow: false },
  };
}

export default async function JoinPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const t = await getTranslations("auth.join");
  const { code: raw } = await params;
  const code = normalizeReferralCode(decodeURIComponent(raw));
  const inviter = isValidReferralCode(code) ? await findInviterByCode(code) : null;
  const spotsLeft = inviter ? foundingSpotsLeft(await getFounderCount()) : 0;

  const inviterName = inviter?.full_name?.trim() || inviter?.email?.split("@")[0] || null;

  const perks = [
    t("perks.free", { limit: FREE_CLIENT_LIMIT }),
    spotsLeft > 0
      ? t("perks.founding", {
          cap: FOUNDING_CAP,
          price: PRICES.founding.monthly,
          spots: spotsLeft,
        })
      : t("perks.standard", { price: PRICES.standard.monthly }),
    t("perks.referral"),
  ];

  return (
    <>
      <MarketingNav variant="minimal" />
      <main className="flex flex-1 items-center justify-center px-4 py-12">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <LogoMark className="mx-auto mb-3 size-12" />
            {inviter ? (
              <>
                <CardTitle className="text-2xl text-balance">
                  {inviterName
                    ? t("invitedBy", { name: inviterName, site: SITE_NAME })
                    : t("invited", { site: SITE_NAME })}
                </CardTitle>
                <CardDescription className="text-pretty">
                  {t("description", { site: SITE_NAME })}
                </CardDescription>
              </>
            ) : (
              <>
                <CardTitle className="text-2xl">{t("invalidTitle")}</CardTitle>
                <CardDescription className="text-pretty">
                  {t("invalidDescription", { site: SITE_NAME })}
                </CardDescription>
              </>
            )}
          </CardHeader>
          <CardContent className="space-y-6">
            {inviter ? (
              <>
                <ul className="space-y-2 text-sm">
                  {perks.map((perk) => (
                    <li key={perk} className="flex items-start gap-2">
                      <Check className="text-primary mt-0.5 size-4 shrink-0" />
                      <span>{perk}</span>
                    </li>
                  ))}
                </ul>
                <Button asChild size="lg" className="w-full">
                  <a href={`/join/${code}/accept`}>
                    {t("accept")} <ArrowRight />
                  </a>
                </Button>
                <p className="text-muted-foreground text-center text-xs">
                  {t("note")}
                </p>
              </>
            ) : (
              <Button asChild size="lg" className="w-full">
                <Link href="/login">
                  {t("startFree")} <ArrowRight />
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>
      </main>
    </>
  );
}
