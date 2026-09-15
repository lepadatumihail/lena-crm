import { Skeleton } from "@/components/ui/skeleton";

const SECTIONS = [3, 2, 1];

/** Task-list-shaped placeholder while /tasks loads. */
export default function TasksLoading() {
  return (
    <div className="space-y-4" aria-busy="true">
      <div className="flex items-end gap-3 border-b">
        <div className="flex h-9 items-center gap-4 px-3">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-12" />
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Skeleton className="h-8 w-full rounded-lg sm:w-64" />
        <Skeleton className="h-8 w-32 rounded-lg" />
        <Skeleton className="h-8 w-32 rounded-lg" />
        <div className="ml-auto flex items-center gap-2">
          <Skeleton className="h-8 w-16 rounded-lg" />
          <Skeleton className="h-8 w-24 rounded-full" />
        </div>
      </div>
      <div className="bg-card overflow-hidden rounded-xl border shadow-xs">
        {SECTIONS.map((rows, section) => (
          <div key={section} className="border-t first:border-t-0">
            <div className="bg-muted/30 flex h-[38px] items-center gap-2 border-b px-4">
              <Skeleton className="size-1.5 rounded-full" />
              <Skeleton className="h-3 w-20" />
            </div>
            <div className="divide-y">
              {Array.from({ length: rows }, (_, row) => (
                <div key={row} className="flex h-[42px] items-center gap-2 px-2 md:pr-4">
                  <Skeleton className="m-1.5 size-4 rounded-full" />
                  <Skeleton className="hidden size-4 rounded-sm md:block" />
                  <Skeleton className="ml-1.5 h-3.5 w-48 max-w-[50%]" />
                  <Skeleton className="ml-auto h-5 w-16 rounded-full" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
