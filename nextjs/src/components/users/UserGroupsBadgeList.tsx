"use client";

import { GroupComboBoxSelector } from "../groups/GroupComboBoxSelector";
import React from "react";
import { UserGroup } from "@/server/actions/groups";
import { UserGroupBadge } from "./UserGroupBadge";
import { canMutateUsers } from "@/lib/permissions";
import { useSession } from "next-auth/react";

export type UserGroupsBadgeListProps = {
  memberGroups: UserGroup[];
  userId: string;
  nonMemberGroups: UserGroup[];
};
export function UserGroupsBadgeList(props: UserGroupsBadgeListProps) {
  const { memberGroups, userId, nonMemberGroups } = props;
  const { data: session } = useSession();

  const hasPerms = canMutateUsers(session);
  return (
    <div className="flex max-w-3xl flex-wrap gap-2">
      {memberGroups.map((group) => {
        return <UserGroupBadge group={group} key={group.id} userId={userId} />;
      })}

      {hasPerms && (
        <GroupComboBoxSelector groups={nonMemberGroups} userId={userId} />
      )}
    </div>
  );
}
