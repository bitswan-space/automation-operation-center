import DashboardLayout from "@/components/layout/DashboardLayout";
import { type NextPageWithLayout } from "./_app";
import { type ReactElement } from "react";
import { Card, CardContent } from "@/components/ui/card";
import React from "react";
import { TitleBar } from "../components/layout/TitleBar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ServerCog, Ungroup, Users } from "lucide-react";
import { CreateGitopsForm } from "../components/gitops/CreateGitopsForm";
import { GitopsList } from "../components/gitops/GitopsList";
import { UserDetailTable } from "@/components/users/UserDetailTable";
import { GroupDetailTable } from "@/components/groups/GroupDetailTable";

const SettingsPage: NextPageWithLayout = () => {
  return (
    <div className="min-h-screen p-4 lg:p-8">
      <h1 className="text-2xl font-bold text-stone-700 md:hidden">Settings</h1>
      <TitleBar title="Settings" />

      <div className="hidden h-full py-4 lg:block">
        <Card
          className={
            "h-full w-full rounded-md border border-slate-300 shadow-sm"
          }
        >
          <CardContent className="h-full p-3">
            <Tabs defaultValue="users">
              <TabsList>
                <TabsTrigger value="users">
                  <Users size={20} className="mr-2" /> Users
                </TabsTrigger>
                <TabsTrigger value="groups">
                  <Ungroup size={20} className="mr-2" /> Groups
                </TabsTrigger>
                <TabsTrigger value="gitops">
                  <ServerCog size={20} className="mr-2" /> Gitops
                </TabsTrigger>
              </TabsList>

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
                  <CreateGitopsForm />
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

SettingsPage.getLayout = function getLayout(page: ReactElement) {
  return <DashboardLayout>{page}</DashboardLayout>;
};

export default SettingsPage;
