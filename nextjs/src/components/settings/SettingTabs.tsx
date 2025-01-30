import { ServerCog, Settings, Ungroup, Users } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";

import GitopsDisplay from "../gitops/GitopsDisplay";
import { GitopsListResponse } from "../gitops/hooks";
import { GroupDetailTable } from "../groups/GroupDetailTable";
import { OrgUsersListResponse } from "@/server/actions/users";
import React from "react";
import { SwitchForm } from "./EditModeForm";
import { UserDetailTable } from "../users/UserDetailTable";
import { UserGroupsListResponse } from "@/server/actions/groups";

type SettingTabsProps = {
  groupsList?: UserGroupsListResponse;
  usersList?: OrgUsersListResponse;
  gitopsList?: GitopsListResponse;
};

export function SettingTabs(props: SettingTabsProps) {
  const { groupsList, usersList, gitopsList } = props;

  return (
    <Tabs defaultValue="general">
      <TabsList>
        <TabsTrigger value="general">
          <Settings size={16} className="mr-2" /> General
        </TabsTrigger>
        <TabsTrigger value="users">
          <Users size={16} className="mr-2" /> Users
        </TabsTrigger>
        <TabsTrigger value="groups">
          <Ungroup size={16} className="mr-2" /> Groups
        </TabsTrigger>
        <TabsTrigger value="gitops">
          <ServerCog size={16} className="mr-2" /> Gitops
        </TabsTrigger>
      </TabsList>
      <TabsContent value="general">
        <div className="w-full">
          <SwitchForm />
        </div>
      </TabsContent>
      <TabsContent value="users">
        <div className="w-full">
          <UserDetailTable userGroups={groupsList} usersList={usersList} />
        </div>
      </TabsContent>
      <TabsContent value="groups">
        <div className="w-full">
          <GroupDetailTable userGroups={groupsList} />
        </div>
      </TabsContent>
      <TabsContent value="gitops">
        <GitopsDisplay gitopsList={gitopsList} />
      </TabsContent>
    </Tabs>
  );
}
