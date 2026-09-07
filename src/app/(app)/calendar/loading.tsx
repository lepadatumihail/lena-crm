import { Skeleton } from "@/components/ui/skeleton";

/** Calendar-shaped placeholder while a week or month is fetched. */
export default function CalendarLoading() {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Skeleton className="h-8 w-56" />
        <div className="flex items-center gap-2">
          <Skeleton className="size-9" />
          <Skeleton className="h-8 w-16" />
          <Skeleton className="size-9" />
          <Skeleton className="h-8 w-28" />
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-8 w-20" />
        </div>
      </div>
      <Skeleton className="h-[32rem] w-full rounded-lg" />
    </div>
  );
}
