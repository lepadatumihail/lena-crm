import { useTranslations } from "next-intl";

import { Tag } from "@/components/ui/tag";
import { stageLabel } from "@/i18n/labels";
import { STAGE_TONES, type Stage } from "@/lib/crm";

export function StageBadge({
  stage,
  dot = false,
  className,
}: {
  stage: string;
  /** A solid dot in the stage's colour before the label. */
  dot?: boolean;
  className?: string;
}) {
  const t = useTranslations("crm");
  const tone = STAGE_TONES[stage as Stage] ?? "neutral";
  return (
    <Tag tone={tone} dot={dot} className={className}>
      {stageLabel(t, stage)}
    </Tag>
  );
}
