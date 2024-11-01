"use client";

import { Card, CardContent } from "@/components/ui/card";
import { ServerCog, Settings, Ungroup, Users } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { CreateGitopsForm } from "@/components/gitops/CreateGitopsForm";
import { GitopsList } from "@/components/gitops/GitopsList";
import { GroupDetailTable } from "@/components/groups/GroupDetailTable";
import React from "react";
import { SwitchForm } from "@/components/settings/EditModeForm";
import { TitleBar } from "@/components/layout/TitleBar";
import { UserDetailTable } from "@/components/users/UserDetailTable";
import { canMutateGitops } from "@/lib/permissions";
import { useSession } from "next-auth/react";

const SettingsPage = () => {
  const { data: session } = useSession();
  const hasPerms = canMutateGitops(session);

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
                  <UserDetailTable />
                </div>
              </TabsContent>
              <TabsContent value="groups">
                <div className="w-full">
                  <GroupDetailTable />
                </div>
              </TabsContent>
              <TabsContent value="gitops">
                <div className="w-2/3 px-2 py-4">
                  {hasPerms && <CreateGitopsForm />}
                  <div className="py-4 ">
                    <h2 className="py-2 text-base font-semibold text-neutral-700">
                      Configured Gitops:
                    </h2>
                    <GitopsList />
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SettingsPage;
