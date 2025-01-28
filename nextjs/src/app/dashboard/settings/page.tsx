import { Card, CardContent } from "@/components/ui/card";

import React from "react";
import { SettingTabs } from "./../../../components/settings/SettingTabs";
import { TitleBar } from "@/components/layout/TitleBar";
import { fetchCompanyGroups } from "@/server/actions/groups";
import { fetchGitopsList } from "@/server/actions/gitops";
import { fetchOrgUsers } from "@/server/actions/users";

const SettingsPage = async () => {
  const groupsList = await fetchCompanyGroups();
  const usersList = await fetchOrgUsers();
  const gitopsList = await fetchGitopsList();

  return (
    <div className="flex w-full flex-col gap-4">
      <h1 className="text-2xl font-bold text-stone-700 md:hidden">Settings</h1>
      <TitleBar title="Settings" />

      <div className="hidden min-h-[100vh] flex-1 md:min-h-min lg:flex">
        <Card
          className={
            "h-full w-full rounded-md border border-slate-300 shadow-sm"
          }
        >
          <CardContent className="h-full p-3">
            <SettingTabs
              groupsList={groupsList}
              usersList={usersList}
              gitopsList={gitopsList}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SettingsPage;
