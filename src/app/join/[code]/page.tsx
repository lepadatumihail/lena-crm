import type { Metadata } from "next";
import Link from "next/link";
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

export const metadata: Metadata = {
  title: "You're invited",
  robots: { index: false, follow: false },
};

export default async function JoinPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code: raw } = await params;
  const code = normalizeReferralCode(decodeURIComponent(raw));
  const inviter = isValidReferralCode(code) ? await findInviterByCode(code) : null;
  const spotsLeft = inviter ? foundingSpotsLeft(await getFounderCount()) : 0;

  const inviterName = inviter?.full_name?.trim() || inviter?.email?.split("@")[0] || null;

  const perks = [
    `Free forever for up to ${FREE_CLIENT_LIMIT} clients — every feature included`,
    spotsLeft > 0
      ? `Be one of the first ${FOUNDING_CAP} paying agents and lock Pro at €${PRICES.founding.monthly}/mo for life (${spotsLeft} spots left)`
      : `Pro is €${PRICES.standard.monthly}/mo for unlimited clients`,
    `A free month for you both once you're on Pro`,
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
                    ? `${inviterName} invited you to ${SITE_NAME}`
                    : `You're invited to ${SITE_NAME}`}
                </CardTitle>
                <CardDescription className="text-pretty">
                  {SITE_NAME} is the CRM for independent real-estate agents: every buyer and
                  seller, across all the agencies you work with, in one place.
                </CardDescription>
              </>
            ) : (
              <>
                <CardTitle className="text-2xl">This link isn&apos;t valid</CardTitle>
                <CardDescription className="text-pretty">
                  Check it with the agent who sent it. You can still start using {SITE_NAME}{" "}
                  for free right now.
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
                    Accept invite <ArrowRight />
                  </a>
                </Button>
                <p className="text-muted-foreground text-center text-xs">
                  No card needed. Sign in with Google or a one-time email code.
                </p>
              </>
            ) : (
              <Button asChild size="lg" className="w-full">
                <Link href="/login">
                  Start free <ArrowRight />
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>
      </main>
    </>
  );
}
