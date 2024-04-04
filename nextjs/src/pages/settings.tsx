import DashboardLayout from "@/components/layout/DashboardLayout";
import { type NextPageWithLayout } from "./_app";
import { type ReactElement } from "react";
import { Card, CardContent } from "@/components/ui/card";
import React from "react";
import { TitleBar } from "../components/layout/TitleBar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ServerCog } from "lucide-react";
import { CreateGitopsForm } from "../components/gitops/CreateGitopsForm";
import { GitopsList } from "../components/gitops/GitopsList";

const SettingsPage: NextPageWithLayout = () => {
  return (
    <div className="p-4 lg:p-8">
        <h1 className="text-2xl font-bold text-stone-700 md:hidden">
          Settings
        </h1>
        <TitleBar title="Settings" />

        <div className="hidden py-4 lg:block">
          <Card
            className={
              "h-full w-full rounded-md border border-slate-300 shadow-sm"
            }
          >
            <CardContent className="p-3">
              <Tabs defaultValue="account" className="w-2/3">
                <TabsList>
                  <TabsTrigger value="account">
                    <ServerCog size={20} className="mr-2" /> Gitops
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="account">
                  <CreateGitopsForm />
                  <div className="py-4">
                    <h2 className="py-2 text-base font-semibold text-neutral-700">
                      Configured Gitops:
                    </h2>
                    <GitopsList />
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
