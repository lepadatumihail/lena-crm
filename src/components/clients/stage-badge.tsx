import { useTranslations } from "next-intl";

import { Badge } from "@/components/ui/badge";
import { stageLabel } from "@/i18n/labels";
import { STAGE_TONES, type Stage } from "@/lib/crm";

export function StageBadge({ stage }: { stage: string }) {
  const t = useTranslations("crm");
  const tone = STAGE_TONES[stage as Stage] ?? "secondary";
  return <Badge variant={tone}>{stageLabel(t, stage)}</Badge>;
}
