"use client";

import { Loader2, X } from "lucide-react";
import { UserGroup, removeMemberFromGroup } from "../groups/groupsHooks";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { Badge } from "../ui/badge";
import { ORG_USERS_QUERY_KEY } from "@/shared/constants";
import { canMutateUsers } from "@/lib/permissions";
import { useSession } from "next-auth/react";

type UserGroupBadgeProps = {
  group: UserGroup;
  userId: string;
};

export function UserGroupBadge(props: UserGroupBadgeProps) {
  const { group, userId } = props;

  const { data: session } = useSession();
  const queryClient = useQueryClient();

  const accessToken = session?.access_token;

  const removeMemberFromGroupMutation = useMutation({
    mutationFn: removeMemberFromGroup,
    onSuccess: () => {
      console.log("User group updated");
      queryClient
        .invalidateQueries({
          queryKey: [ORG_USERS_QUERY_KEY],
        })
        .then(() => {
          console.log("Invalidated org-users query");
        })
        .catch((error) => {
          console.error("Error invalidating org-users query", error);
        });
    },
  });

  const onRemoveGroupClick = (groupId?: string) => {
    removeMemberFromGroupMutation.mutate({
      accessToken: accessToken ?? "",
      userId: userId,
      groupId: groupId ?? "",
    });
  };

  const isLoading = removeMemberFromGroupMutation.isPending;
  const hasPerms = canMutateUsers(session);

  return (
    <Badge
      variant={"outline"}
      className={`border-[${group.tag_color}] bg-[${group.tag_color}]/10 text-[${group.tag_color}] flex gap-2`}
      style={{
        borderColor: group.tag_color,
        backgroundColor: `${group.tag_color}1A`,
        color: group.tag_color,
      }}
    >
      <span>{group.name}</span>
      {hasPerms && (
        <button
          className="cursor-pointer"
          onClick={() => onRemoveGroupClick(group.id)}
          disabled={isLoading || !hasPerms}
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <X className="h-4 w-4" />
          )}
        </button>
      )}
    </Badge>
  );
}
