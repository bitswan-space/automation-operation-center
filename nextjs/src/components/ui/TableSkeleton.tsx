import { Skeleton } from "./skeleton";

export const TableSkeleton = () => {
  return (
    <div className="flex flex-col gap-4">
      <Skeleton className="h-8 max-w-sm" />
      <div className="flex flex-col gap-2 border rounded-md p-4">
        <span className="flex flex-row bg-stone-100/70">
          <Skeleton className="h-7 w-full" />
        </span>
        <span className="flex flex-row gap-2">
          <Skeleton className="h-6 w-1/6" />
          <Skeleton className="h-6 w-1/6" />
          <Skeleton className="h-6 w-1/6" />
          <Skeleton className="h-6 w-1/6" />
          <Skeleton className="h-6 w-1/6" />
          <Skeleton className="h-6 w-1/6" />
        </span>
        <span className="flex flex-row gap-2">
          <Skeleton className="h-6 w-1/6" />
          <Skeleton className="h-6 w-1/6" />
          <Skeleton className="h-6 w-1/6" />
          <Skeleton className="h-6 w-1/6" />
          <Skeleton className="h-6 w-1/6" />
          <Skeleton className="h-6 w-1/6" />
        </span>
      </div>
    </div>
  );
};
