import { TASK_PRIORITY_TONES, type TaskPriority } from "@/lib/tasks";
import { TONE_ICON } from "@/lib/tones";
import { cn } from "@/lib/utils";

const BARS = [
  { x: 2.5, height: 5 },
  { x: 6.5, height: 8 },
  { x: 10.5, height: 11 },
] as const;

/** How many bars read at full strength for each level. */
const LEVEL: Record<"low" | "medium" | "high", number> = { low: 1, medium: 2, high: 3 };

/**
 * Linear's priority glyphs: dashes for none, rising signal bars for low to
 * high, a filled square with an exclamation for urgent. Drawn in
 * currentColor; decorative, the control around it carries the label.
 */
export function PriorityIcon({ priority, className }: { priority: TaskPriority; className?: string }) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden
      className={cn("size-4 shrink-0", TONE_ICON[TASK_PRIORITY_TONES[priority]], className)}
    >
      {priority === "none" ? (
        BARS.map((bar) => (
          <rect key={bar.x} x={bar.x} y="7.25" width="3" height="1.5" rx="0.75" fill="currentColor" />
        ))
      ) : priority === "urgent" ? (
        <>
          <rect x="1.5" y="1.5" width="13" height="13" rx="3" fill="currentColor" />
          <path
            d="M8 4.5v4.25M8 11.25v.01"
            className="stroke-background"
            strokeWidth="1.75"
            strokeLinecap="round"
          />
        </>
      ) : (
        BARS.map((bar, index) => (
          <rect
            key={bar.x}
            x={bar.x}
            y={14 - bar.height}
            width="3"
            height={bar.height}
            rx="1"
            fill="currentColor"
            className={index < LEVEL[priority] ? undefined : "opacity-25"}
          />
        ))
      )}
    </svg>
  );
}
