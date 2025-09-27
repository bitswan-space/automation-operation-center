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
};

type SettingTab = "users" | "groups" | "general";

export function SettingTabs(props: SettingTabsProps) {
  const { groupsList, usersList } = props;
  
  // Check if experimental features should be shown
  const showExperimental = process.env.REACT_APP_BITSWAN_EXPERIMENTAL?.toLowerCase() === 'true';

  const [activeTab, setActiveTab] = useState<SettingTab>(
    showExperimental ? "general" : "users",
  );

  // Update URL when tab changes
  useEffect(() => {
    const url = new URL(window.location.href);
    url.searchParams.set('activeTab', activeTab);
    window.history.replaceState({}, '', url.toString());
  }, [activeTab]);

  // Read initial tab from URL
  useEffect(() => {
    const url = new URL(window.location.href);
    const tabFromUrl = url.searchParams.get('activeTab') as SettingTab;
    if (tabFromUrl && (tabFromUrl === 'users' || tabFromUrl === 'groups' || tabFromUrl === 'general')) {
      setActiveTab(tabFromUrl);
    }
  }, []);

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
          <UserDetailTable userGroups={groupsList} usersList={usersList} />
        </div>
      </TabsContent>
      <TabsContent value="groups">
        <div className="w-full">
          <GroupDetailTable userGroups={groupsList} />
        </div>
      </TabsContent>
    </Tabs>
  );
}