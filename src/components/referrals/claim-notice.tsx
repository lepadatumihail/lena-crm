import { useTranslations } from "next-intl";
import { Gift } from "lucide-react";

import { Notice } from "@/components/ui/notice";
import { claimMessage } from "@/lib/referrals/links";
import type { Tone } from "@/lib/tones";

const MESSAGE_TONE: Record<"success" | "info" | "error", Tone> = {
  success: "green",
  info: "neutral",
  error: "red",
};

/**
 * How a referral link went, told once on Home right after sign-in:
 * `claimed` is the result /join/claim redirected here with.
 */
export function ClaimNotice({ claimed }: { claimed: string | undefined }) {
  const t = useTranslations("referrals");
  const message = claimMessage(claimed);
  if (!message) return null;
  return (
    <Notice
      tone={MESSAGE_TONE[message.tone]}
      icon={message.tone === "success" ? Gift : undefined}
    >
      {t(message.key)}
    </Notice>
  );
}
