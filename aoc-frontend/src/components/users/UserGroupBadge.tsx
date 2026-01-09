"use client";

import * as React from "react";

import { Loader2, X } from "lucide-react";
import { type UserGroup } from "@/data/groups";

import { Badge } from "../ui/badge";
import { useAdminStatus } from "@/hooks/useAdminStatus";
import { toast } from "sonner";
import { useRemoveUserFromGroup } from "@/hooks/useGroupQuery";

type UserGroupBadgeProps = {
  group: UserGroup;
  id: string;
};

export function UserGroupBadge(props: UserGroupBadgeProps) {
  const { group, id } = props;

  const removeUserFromGroupMutation = useRemoveUserFromGroup(id);
  const hasPerms = useAdminStatus().isAdmin;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const groupId = formData.get("groupId") as string;
    
    removeUserFromGroupMutation.mutate(groupId, {
      onSuccess: () => {
        toast.success("Successfully removed from group");
      },
      onError: (error) => {
        toast.error((error as any)?.message ?? "Error removing from group");
      },
    });
  };

  return (
    <Badge
      variant={"outline"}
      className={`border-[${group.tag_color}] bg-[${group.tag_color}]/10 text-[${group.tag_color}] flex gap-2 py-2`}
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
            className="cursor-pointer flex items-center"
            type="submit"
            disabled={removeUserFromGroupMutation.isPending || !hasPerms}
          >
            {removeUserFromGroupMutation.isPending ? (
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
