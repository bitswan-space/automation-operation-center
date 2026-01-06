import { Loader2 } from "lucide-react";
import { useWorkspaceUsersQuery } from "@/hooks/useWorkspacesQuery";

type WorkspaceUserCountProps = {
  workspaceId: string;
};

export function WorkspaceUserCount({ workspaceId }: WorkspaceUserCountProps) {
  const { data: workspaceUsers, isLoading: isLoadingUsers } = useWorkspaceUsersQuery(workspaceId);
  const userCount = workspaceUsers?.length ?? 0;

  return (
    <span>
      {isLoadingUsers ? (
        <Loader2 size={14} className="animate-spin inline-block" />
      ) : (
        userCount
      )}{" "}
      users
    </span>
  );
}

