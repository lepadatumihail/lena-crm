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
import { findActiveInvite } from "@/lib/referrals/engine";
import {
  FOUNDING_INVITE_QUOTA,
  FOUNDING_PRICE_EUR,
  STANDARD_PRICE_EUR,
  isValidInviteCode,
  normalizeInviteCode,
} from "@/lib/invites";
import { SITE_NAME } from "@/lib/site";

export const metadata: Metadata = {
  title: "You're invited",
  robots: { index: false, follow: false },
};

const PERKS = [
  `€${FOUNDING_PRICE_EUR} a month instead of €${STANDARD_PRICE_EUR}, locked for life`,
  "A Founding Agent number, yours for good",
  `${FOUNDING_INVITE_QUOTA} invites for the agents you co-broke with`,
];

export default async function JoinPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code: raw } = await params;
  const code = normalizeInviteCode(decodeURIComponent(raw));
  const found = isValidInviteCode(code) ? await findActiveInvite(code) : null;

  const inviterName =
    found?.inviter?.full_name?.trim() ||
    found?.inviter?.email?.split("@")[0] ||
    null;

  return (
    <>
      <MarketingNav variant="minimal" />
      <main className="flex flex-1 items-center justify-center px-4 py-12">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <LogoMark className="mx-auto mb-3 size-12" />
            {found ? (
              <>
                <CardTitle className="text-2xl text-balance">
                  {inviterName
                    ? `${inviterName} invited you to the Founding circle`
                    : `You're invited to the ${SITE_NAME} Founding circle`}
                </CardTitle>
                <CardDescription className="text-pretty">
                  {SITE_NAME} is the CRM for independent real-estate agents:
                  every buyer and seller, across all the agencies you work
                  with, in one place. The first twenty agents to join as
                  founders get this.
                </CardDescription>
              </>
            ) : (
              <>
                <CardTitle className="text-2xl">This invite has expired</CardTitle>
                <CardDescription className="text-pretty">
                  Invites last 30 days and can only be used once. You can
                  still join {SITE_NAME} at the standard plan, and a founder
                  can always send you a fresh code.
                </CardDescription>
              </>
            )}
          </CardHeader>
          <CardContent className="space-y-6">
            {found ? (
              <>
                <ul className="space-y-2 text-sm">
                  {PERKS.map((perk) => (
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
                  7-day free trial, no card needed. Sign in with Google or a
                  one-time email code.
                </p>
              </>
            ) : (
              <Button asChild size="lg" className="w-full">
                <Link href="/login">
                  Join at the standard plan <ArrowRight />
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>
      </main>
    </>
  );
}
