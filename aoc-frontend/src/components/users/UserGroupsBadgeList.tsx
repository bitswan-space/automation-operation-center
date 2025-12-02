import { GroupComboBoxSelector } from "../groups/GroupComboBoxSelector";
import { UserGroupBadge } from "./UserGroupBadge";
import { useAdminStatus } from "@/hooks/useAdminStatus";
import { type OrgUser } from "@/data/users";

export type UserGroupsBadgeListProps = {
  user: OrgUser;
};

export function UserGroupsBadgeList(props: UserGroupsBadgeListProps) {
  const { user } = props;
  const { isAdmin: hasPerms } = useAdminStatus();

  return (
    <div className="flex max-w-3xl flex-wrap gap-2">
      {user.groups.map((group) => {
        return (
          <UserGroupBadge
            group={group}
            key={group.id}
            id={user.id}
          />
        );
      })}

      {hasPerms && (
        <GroupComboBoxSelector
          userId={user.id}
        />
      )}
    </div>
  );
}
