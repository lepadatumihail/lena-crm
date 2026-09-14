import { Skeleton } from "@/components/ui/skeleton";

/** Calendar-shaped placeholder while a week or month is fetched. */
export default function CalendarLoading() {
  return (
    <div className="space-y-4" aria-busy="true">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2.5">
        <div className="flex items-center gap-1">
          <Skeleton className="h-8 w-16 rounded-lg" />
          <Skeleton className="size-8" />
          <Skeleton className="size-8" />
        </div>
        <Skeleton className="h-6 w-44" />
        <div className="ml-auto flex items-center gap-2">
          <Skeleton className="h-8 w-32 rounded-lg" />
          <Skeleton className="h-8 w-8 rounded-lg sm:w-24" />
          <Skeleton className="h-8 w-20 rounded-full" />
        </div>
      </div>
      <Skeleton className="h-[32rem] w-full rounded-xl" />
    </div>
  );
}
