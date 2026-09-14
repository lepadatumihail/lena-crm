import { Skeleton } from "@/components/ui/skeleton";

const ROWS = 8;

/** The shape of a list page while its data loads: a toolbar and eight quiet rows. */
export default function Loading() {
  return (
    <div className="space-y-4" aria-busy="true">
      <div className="flex items-center justify-between gap-3">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-8 w-32" />
      </div>
      <div className="bg-card overflow-hidden rounded-xl border">
        <div className="bg-muted/30 h-[38px] border-b" />
        {Array.from({ length: ROWS }, (_, i) => (
          <div
            key={i}
            className="flex h-[42px] items-center gap-4 border-b px-3 last:border-0"
          >
            <Skeleton className="size-6 rounded-full" />
            <Skeleton className="h-3 w-40" />
            <Skeleton className="h-5 w-20 rounded-full" />
            <Skeleton className="ml-auto h-3 w-24" />
          </div>
        ))}
      </div>
    </div>
  );
}
