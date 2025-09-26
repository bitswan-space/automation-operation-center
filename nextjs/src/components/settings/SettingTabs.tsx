"use client";

import { Settings, Ungroup, Users } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { useState } from "react";

import { GroupDetailTable } from "../groups/GroupDetailTable";

import React from "react";
import { SwitchForm } from "./EditModeForm";
import { UserDetailTable } from "../users/UserDetailTable";
import { type UserGroupsListResponse } from "@/data/groups";
import { useQueryState } from "nuqs";
import { type OrgUsersListResponse } from "@/data/users";
import { env } from "@/env.mjs";

type SettingTabsProps = {
  groupsList?: UserGroupsListResponse;
  usersList?: OrgUsersListResponse;
};

type SettingTab = "users" | "groups";

export function SettingTabs(props: SettingTabsProps) {
  const { groupsList, usersList } = props;
  
  // Check if experimental features should be shown
  const showExperimental = env.NEXT_PUBLIC_BITSWAN_EXPERIMENTAL?.toLowerCase() === 'true';

  const [activeTabParam, setActiveTabParam] = useQueryState("activeTab", {
    defaultValue: showExperimental ? "general" : "users",
  });

  const [activeTab, setActiveTab] = useState<SettingTab>(
    activeTabParam as SettingTab,
  );

  const handleTabChange = (tab: SettingTab) => {
    setActiveTab(tab);
    setActiveTabParam(tab).catch((error) => {
      console.error(error);
    });
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
