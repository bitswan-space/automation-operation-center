"use client";

import * as React from "react";

import { Loader2, X } from "lucide-react";
import { type UserGroup } from "@/data/groups";

import { Badge } from "../ui/badge";
import { useAdminStatus } from "@/hooks/useAdminStatus";
import { useAuth } from "@/context/AuthContext";
import { useAction } from "@/hooks/useAction";
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
  onUserGroupUpdate?: (userId: string, groupId: string, action: 'add' | 'remove') => void;
};

export function UserGroupBadge(props: UserGroupBadgeProps) {
  const { group, id, action, onUserGroupUpdate } = props;

  const { user: session } = useAuth();

  const { execute, isPending } = useAction(action, {
    onSuccess: () => {
      toast.success("Successfully removed from group");
      if (onUserGroupUpdate) {
        onUserGroupUpdate(id, group.id, 'remove');
      }
    },
    onError: ({ error }) => {
      toast.error(
        (error as any)?.serverError?.message ?? "Error removing from group",
      );
    },
  });

  const hasPerms = useAdminStatus().isAdmin;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      id: formData.get("id") as string,
      groupId: formData.get("groupId") as string,
    };
    await execute(data);
  };

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
        <form onSubmit={handleSubmit}>
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
