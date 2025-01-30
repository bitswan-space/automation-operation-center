import { Card, CardContent } from "@/components/ui/card";

import React from "react";
import { SettingTabs } from "./../../../components/settings/SettingTabs";
import { TitleBar } from "@/components/layout/TitleBar";
import { auth } from "@/server/auth";
import { cacheTag } from "next/dist/server/use-cache/cache-tag";
import { fetchGitopsList } from "@/server/actions/gitops";
import { fetchOrgGroups } from "@/server/actions/groups";
import { fetchOrgUsers } from "@/server/actions/users";

const SettingsPage = async () => {
  const session = await auth();

  const groupsList = await fetchOrgGroups(session);
  const usersList = await fetchOrgUsers(session);
  const gitopsList = await fetchGitopsList(session);

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
