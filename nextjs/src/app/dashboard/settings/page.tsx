import { Card, CardContent } from "@/components/ui/card";

import React from "react";
import { SettingTabs } from "./../../../components/settings/SettingTabs";
import { TitleBar } from "@/components/layout/TitleBar";
import { fetchOrgGroups } from "@/data/groups";
import { fetchOrgUsers } from "@/data/users";

const SettingsPage = async () => {
  const groupsList = await fetchOrgGroups();
  const usersList = await fetchOrgUsers();

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
            <SettingTabs groupsList={groupsList} usersList={usersList} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SettingsPage;
