"use client";

import * as React from "react";

import { Loader2, X } from "lucide-react";
import {
  RemoveMemberFromGroupFormActionState,
  UserGroup,
  removeMemberFromGroupAction,
} from "@/server/actions/groups";

import { Badge } from "../ui/badge";
import { canMutateUsers } from "@/lib/permissions";
import { useSession } from "next-auth/react";

type UserGroupBadgeProps = {
  group: UserGroup;
  userId: string;
};

export function UserGroupBadge(props: UserGroupBadgeProps) {
  const { group, userId } = props;

  const { data: session } = useSession();

  const [, formAction, isPending] = React.useActionState<
    RemoveMemberFromGroupFormActionState,
    FormData
  >(removeMemberFromGroupAction, {});

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
        <form action={formAction}>
          <input
            type="hidden"
            name="userId"
            defaultValue={userId}
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
