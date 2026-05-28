import { Badge } from "@/components/ui/badge";
import { STAGE_LABELS, STAGE_TONES, type Stage } from "@/lib/crm";

export function StageBadge({ stage }: { stage: string }) {
  const label = STAGE_LABELS[stage as Stage] ?? stage;
  const tone = STAGE_TONES[stage as Stage] ?? "secondary";
  return <Badge variant={tone}>{label}</Badge>;
}
