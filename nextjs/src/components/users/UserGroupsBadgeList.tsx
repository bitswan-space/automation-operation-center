"use client";

import { GroupComboBoxSelector } from "../groups/GroupComboBoxSelector";
import React from "react";
import { type UserGroup } from "@/data/groups";
import { UserGroupBadge } from "./UserGroupBadge";
import { canMutateUsers } from "@/lib/permissions";
import { useSession } from "next-auth/react";
import {
  type AddWorkspaceToGroupActionType,
  type RemoveWorkspaceFromGroupActionType,
  type AddUserToGroupActionType,
  type RemoveUserFromGroupActionType,
} from "../groups/action";

export type UserGroupsBadgeListProps = {
  memberGroups: UserGroup[];
  id: string;
  nonMemberGroups: UserGroup[];
  addAction: AddUserToGroupActionType | AddWorkspaceToGroupActionType;
  removeAction: RemoveUserFromGroupActionType | RemoveWorkspaceFromGroupActionType;
};

export function UserGroupsBadgeList(props: UserGroupsBadgeListProps) {
  const { memberGroups, id, nonMemberGroups, addAction, removeAction } = props;
  const { data: session } = useSession();

  const hasPerms = canMutateUsers(session);
  return (
    <div className="flex max-w-3xl flex-wrap gap-2">
      {memberGroups.map((group) => {
        return (
          <UserGroupBadge
            group={group}
            key={group.id}
            id={id}
            action={removeAction}
          />
        );
      })}

      {hasPerms && (
        <GroupComboBoxSelector
          groups={nonMemberGroups}
          id={id}
          action={addAction}
        />
      )}
    </div>
  );
}
