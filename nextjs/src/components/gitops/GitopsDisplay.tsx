"use client";

import { CreateGitopsForm } from "./CreateGitopsForm";
import { GitopsList } from "./GitopsList";
import { GitopsListResponse } from "./hooks";
import { canMutateGitops } from "@/lib/permissions";
import { useSession } from "next-auth/react";

type GitopsDisplayProps = {
  gitopsList?: GitopsListResponse;
};

export default function GitopsDisplay(props: GitopsDisplayProps) {
  const { gitopsList } = props;

  const { data: session } = useSession();
  const hasPerms = canMutateGitops(session);
  return (
    <div className="w-2/3 px-2 py-4">
      {hasPerms && <CreateGitopsForm />}
      <div className="py-4">
        <h2 className="py-2 text-base font-semibold text-neutral-700">
          Configured Gitops:
        </h2>
        <GitopsList gitopsList={gitopsList} />
      </div>
    </div>
  );
}
