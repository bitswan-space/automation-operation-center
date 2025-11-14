import { GroupComboBoxSelector } from "../groups/GroupComboBoxSelector";
import { type UserGroup } from "@/data/groups";
import { UserGroupBadge } from "./UserGroupBadge";
import { useAdminStatus } from "@/hooks/useAdminStatus";
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
  handleNextPage: () => Promise<boolean>;
  hasMoreGroups?: boolean;
};

export function UserGroupsBadgeList(props: UserGroupsBadgeListProps) {
  const { memberGroups, id, nonMemberGroups, addAction, removeAction, onUserGroupUpdate, handleNextPage, hasMoreGroups } = props;

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
          key={`group-selector-${id}`}
          groups={nonMemberGroups}
          id={id}
          action={addAction}
          onUserGroupUpdate={onUserGroupUpdate}
          handleNextPage={handleNextPage}
          hasMoreGroups={hasMoreGroups}
        />
      )}
    </div>
  );
}
