import { AlertCircle } from "lucide-react";
import { GitopsListItem } from "./GitopsListItem";
import React from "react";
import { Skeleton } from "../ui/skeleton";
import { useGitopsList } from "./hooks";

export function GitopsList() {
  const gitopsListQuery = useGitopsList();

  console.log("GitopsList", gitopsListQuery.data?.results);
  return (
    <ul className="space-y-4">
      {gitopsListQuery.data?.results?.map((gitops) => (
        <GitopsListItem key={gitops.id} id={gitops.id} name={gitops.name} />
      ))}
      {gitopsListQuery.isLoading && (
        <Skeleton className="h-[150px] w-full rounded-xl" />
      )}
      {gitopsListQuery.isError && (
        <div className="w-full rounded bg-red-400/30 p-4 text-sm">
          <div className="text-red-600">Error fetching gitops</div>
        </div>
      )}

      {gitopsListQuery.isSuccess &&
        gitopsListQuery.data?.results?.length === 0 && (
          <div className="flex h-[150px] w-full place-items-center justify-center rounded-md bg-neutral-100 text-center text-sm text-neutral-500">
            <div className="flex flex-col justify-center text-center">
              <div className="mx-auto p-2">
                <AlertCircle size={24} />
              </div>
              <div>No gitops found</div>
            </div>
          </div>
        )}
    </ul>
  );
}
