"use client";

import * as React from "react";

import { Loader2, X } from "lucide-react";
import { type UserGroup } from "@/data/groups";

import { Badge } from "../ui/badge";
import { canMutateUsers } from "@/lib/permissions";
import { useSession } from "next-auth/react";
import { useAction } from "next-safe-action/hooks";
import { toast } from "sonner";
import {
  type RemoveUserFromGroupActionType,
  type RemoveWorkspaceFromGroupActionType,
  type RemoveAutomationServerFromGroupActionType,
} from "../groups/action";

type UserGroupBadgeProps = {
  group: UserGroup;
  id: string;
  action:
    | RemoveUserFromGroupActionType
    | RemoveWorkspaceFromGroupActionType
    | RemoveAutomationServerFromGroupActionType;
};

export function UserGroupBadge(props: UserGroupBadgeProps) {
  const { group, id, action } = props;

  const { data: session } = useSession();

  const { execute, isPending } = useAction(action, {
    onSuccess: () => {
      toast.success("Successfully removed from group");
    },
    onError: ({ error }) => {
      toast.error(
        error.serverError?.message ?? "Error removing from group",
      );
    },
  });

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
        <form action={execute}>
          <input
            type="hidden"
            name="id"
            defaultValue={id}
            className="hidden"
          />
          <input
            type="hidden"
            name="groupId"
            defaultValue={group.id}
            className="hidden"
          />
          <button
            className="cursor-pointer"
            type="submit"
            disabled={isPending || !hasPerms}
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <X className="h-4 w-4" />
            )}
          </button>
        </form>
      )}
    </Badge>
  );
}
