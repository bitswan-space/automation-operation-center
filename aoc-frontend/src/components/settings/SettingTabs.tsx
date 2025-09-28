import { Settings, Ungroup, Users } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { useState, useEffect } from "react";

import { GroupDetailTable } from "@/components/groups/GroupDetailTable";

import React from "react";
import { SwitchForm } from "./EditModeForm";
import { UserDetailTable } from "../users/UserDetailTable";
import { type UserGroupsListResponse } from "@/data/groups";
import { type OrgUsersListResponse } from "@/data/users";

type SettingTabsProps = {
  groupsList?: UserGroupsListResponse;
  usersList?: OrgUsersListResponse;
  onUserGroupUpdate?: (userId: string, groupId: string, action: 'add' | 'remove') => void;
  onGroupCreated?: () => void;
  onUserInvited?: () => void;
  onUserDeleted?: () => void;
};

type SettingTab = "users" | "groups" | "general";

export function SettingTabs(props: SettingTabsProps) {
  const { groupsList, usersList, onUserGroupUpdate, onGroupCreated, onUserInvited, onUserDeleted } = props;
  
  // Check if experimental features should be shown
  const showExperimental = process.env.REACT_APP_BITSWAN_EXPERIMENTAL?.toLowerCase() === 'true';

  // Get initial tab from URL or use default
  const getInitialTab = (): SettingTab => {
    const url = new URL(window.location.href);
    const tabFromUrl = url.searchParams.get('activeTab') as SettingTab;
    if (tabFromUrl && (tabFromUrl === 'users' || tabFromUrl === 'groups' || tabFromUrl === 'general')) {
      return tabFromUrl;
    }
    return showExperimental ? "general" : "users";
  };

  const [activeTab, setActiveTab] = useState<SettingTab>(getInitialTab);

  // Update URL when tab changes
  useEffect(() => {
    const url = new URL(window.location.href);
    url.searchParams.set('activeTab', activeTab);
    window.history.replaceState({}, '', url.toString());
  }, [activeTab]);

  const handleTabChange = (tab: SettingTab) => {
    setActiveTab(tab);
  };

  return (
    <Tabs
      value={activeTab}
      onValueChange={(value) => handleTabChange(value as SettingTab)}
    >
      <TabsList>
        {showExperimental && (
          <TabsTrigger value="general">
            <Settings size={16} className="mr-2" /> General
          </TabsTrigger>
        )}
        <TabsTrigger value="users">
          <Users size={16} className="mr-2" /> Users
        </TabsTrigger>
        <TabsTrigger value="groups">
          <Ungroup size={16} className="mr-2" /> Groups
        </TabsTrigger>
      </TabsList>
      {showExperimental && (
        <TabsContent value="general">
          <div className="w-full">
            <SwitchForm />
          </div>
        </TabsContent>
      )}
      <TabsContent value="users">
        <div className="w-full">
          {/* User management with optimistic updates */}
          <UserDetailTable 
            userGroups={groupsList} 
            usersList={usersList} 
            onUserGroupUpdate={onUserGroupUpdate}
            onUserInvited={onUserInvited}
            onUserDeleted={onUserDeleted}
          />
        </div>
      </TabsContent>
      <TabsContent value="groups">
        <div className="w-full">
          <GroupDetailTable userGroups={groupsList} onGroupCreated={onGroupCreated} />
        </div>
      </TabsContent>
    </Tabs>
  );
}