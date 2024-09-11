import DashboardLayout from "@/components/layout/DashboardLayout";
import { type NextPageWithLayout } from "./_app";
import { type ReactElement } from "react";
import { Card, CardContent } from "@/components/ui/card";
import React from "react";
import { TitleBar } from "../components/layout/TitleBar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Network, ServerCog } from "lucide-react";
import { CreateGitopsForm } from "../components/gitops/CreateGitopsForm";
import { GitopsList } from "../components/gitops/GitopsList";
import { CreateMQTTBrokerForm } from "@/components/mqtt-brokers/CreateMQTTBrokerForm";
import { MQTTBrokersList } from "@/components/mqtt-brokers/MQTTBrokersList";

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
            <Tabs defaultValue="gitops" className="w-2/3">
              <TabsList>
                <TabsTrigger value="gitops">
                  <ServerCog size={20} className="mr-2" /> Gitops
                </TabsTrigger>
                <TabsTrigger value="brokers">
                  <Network size={20} className="mr-2" /> Brokers
                </TabsTrigger>
              </TabsList>
              <TabsContent value="gitops">
                <CreateGitopsForm />
                <div className="py-4">
                  <h2 className="py-2 text-base font-semibold text-neutral-700">
                    Configured Gitops:
                  </h2>
                  <GitopsList />
                </div>
              </TabsContent>
              <TabsContent value="brokers" className="p-4 px-2">
                <div className="pb-8">
                  <h2 className="pb-4 text-base font-semibold text-neutral-700">
                    Configured MQTT Brokers:
                  </h2>
                  <MQTTBrokersList />
                </div>
                <div>
                  <div className="pb-4">
                    <div className="font-semibold">Create MQTT Broker</div>
                    <div className="text-sm text-neutral-500">
                      Configure a new MQTT Broker to connect to.
                    </div>
                  </div>
                  <CreateMQTTBrokerForm />
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
