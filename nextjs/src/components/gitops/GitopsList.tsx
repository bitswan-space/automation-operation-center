"use client";

import { AlertCircle } from "lucide-react";
import { GitopsListItem } from "./GitopsListItem";
import { GitopsListResponse } from "./hooks";
import React from "react";

type GitopsListProps = {
  gitopsList?: GitopsListResponse;
};

export function GitopsList(props: GitopsListProps) {
  const { gitopsList } = props;

  return (
    <ul className="space-y-4">
      {gitopsList?.results?.map((gitops) => (
        <GitopsListItem key={gitops.id} id={gitops.id} name={gitops.name} />
      ))}

      {gitopsList?.results?.length === 0 && (
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
