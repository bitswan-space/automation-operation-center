"use client";

import { GroupComboBoxSelector } from "../groups/GroupComboBoxSelector";
import React from "react";
import { type UserGroup } from "@/data/groups";
import { UserGroupBadge } from "./UserGroupBadge";
import { useAdminStatus } from "@/hooks/useAdminStatus";
import { useAuth } from "@/context/AuthContext";
import {
  type AddWorkspaceToGroupActionType,
  type RemoveWorkspaceFromGroupActionType,
  type AddAutomationServerToGroupActionType,
  type RemoveAutomationServerFromGroupActionType,
  type AddUserToGroupActionType,
  type RemoveUserFromGroupActionType,
} from "../groups/action";

export type UserGroupsBadgeListProps = {
  memberGroups: UserGroup[];
  id: string;
  nonMemberGroups: UserGroup[];
  addAction:
    | AddUserToGroupActionType
    | AddWorkspaceToGroupActionType
    | AddAutomationServerToGroupActionType;
  removeAction:
    | RemoveUserFromGroupActionType
    | RemoveWorkspaceFromGroupActionType
    | RemoveAutomationServerFromGroupActionType;
  onUserGroupUpdate?: (userId: string, groupId: string, action: 'add' | 'remove') => void;
};

export function UserGroupsBadgeList(props: UserGroupsBadgeListProps) {
  const { memberGroups, id, nonMemberGroups, addAction, removeAction, onUserGroupUpdate } = props;
  const { user: session } = useAuth();

  const { isAdmin: hasPerms } = useAdminStatus();
  return (
    <div className="flex max-w-3xl flex-wrap gap-2">
      {memberGroups.map((group) => {
        return (
          <UserGroupBadge
            group={group}
            key={group.id}
            id={id}
            action={removeAction}
            onUserGroupUpdate={onUserGroupUpdate}
          />
        );
      })}

      {hasPerms && (
        <GroupComboBoxSelector
          groups={nonMemberGroups}
          id={id}
          action={addAction}
          onUserGroupUpdate={onUserGroupUpdate}
        />
      )}
    </div>
  );
}
