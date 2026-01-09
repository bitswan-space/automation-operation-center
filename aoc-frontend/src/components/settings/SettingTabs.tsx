import { Ungroup, Users } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { useState, useEffect } from "react";

import { GroupDetailTable } from "@/components/groups/GroupDetailTable";

import { UserDetailTable } from "../users/UserDetailTable";

type SettingTab = "users" | "groups";

export function SettingTabs() {
  // Get initial tab from URL or use default
  const getInitialTab = (): SettingTab => {
    const url = new URL(window.location.href);
    const tabFromUrl = url.searchParams.get('activeTab') as SettingTab;
    if (tabFromUrl && (tabFromUrl === 'users' || tabFromUrl === 'groups')) {
      return tabFromUrl;
    }
    return "users";
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
      className="w-full"
    >
      <TabsList>
        <TabsTrigger value="users" className="px-20">
          <Users size={16} className="mr-2" /> Users
        </TabsTrigger>
        <TabsTrigger value="groups" className="px-16">
          <Ungroup size={16} className="mr-2" /> User groups
        </TabsTrigger>
      </TabsList>
      <TabsContent value="users" className="w-full">
        <div className="w-full">
          <UserDetailTable />
        </div>
      </TabsContent>
      <TabsContent value="groups" className="w-full">
        <div className="w-full">
          <GroupDetailTable />
        </div>
      </TabsContent>
    </Tabs>
  );
}
