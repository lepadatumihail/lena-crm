import { useTranslations } from "next-intl";

import { Tag } from "@/components/ui/tag";
import { stageLabel } from "@/i18n/labels";
import { STAGE_TONES, type Stage } from "@/lib/crm";

/**
 * A client's stage as a pill in the stage's tone, with no dot: badges are
 * a pale fill alone, and dots are for standalone markers (tab strips, board
 * columns, the stage menu).
 */
export function StageBadge({
  stage,
  className,
}: {
  stage: string;
  className?: string;
}) {
  const t = useTranslations("crm");
  const tone = STAGE_TONES[stage as Stage] ?? "neutral";
  return (
    <Tag tone={tone} className={className}>
      {stageLabel(t, stage)}
    </Tag>
  );
}
