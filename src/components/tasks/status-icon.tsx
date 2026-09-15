import { TASK_STATUS_TONES, type TaskStatus } from "@/lib/tasks";
import { TONE_ICON } from "@/lib/tones";
import { cn } from "@/lib/utils";

/**
 * Linear's status glyphs: an empty ring to do, a half-filled ring in
 * progress, a ring with clock hands waiting, a checked disc done. Drawn in
 * currentColor, so the tone class sets the hue. Decorative: the control
 * around it carries the label.
 */
export function StatusIcon({ status, className }: { status: TaskStatus; className?: string }) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden
      className={cn("size-4 shrink-0", TONE_ICON[TASK_STATUS_TONES[status]], className)}
    >
      {status === "done" ? (
        <>
          <circle cx="8" cy="8" r="7" fill="currentColor" />
          <path
            d="M5.25 8.25l1.9 1.9 3.6-4"
            className="stroke-background"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </>
      ) : (
        <>
          <circle cx="8" cy="8" r="6.25" stroke="currentColor" strokeWidth="1.5" />
          {status === "in_progress" ? <path d="M8 3.5a4.5 4.5 0 0 1 0 9z" fill="currentColor" /> : null}
          {status === "waiting" ? (
            <path
              d="M8 5v3.25l2 1.5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ) : null}
        </>
      )}
    </svg>
  );
}
