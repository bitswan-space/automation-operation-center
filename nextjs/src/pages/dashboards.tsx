import DashboardLayout from "@/components/layout/DashboardLayout";
import { type NextPageWithLayout } from "./_app";
import { type ReactElement } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import React from "react";
import { TitleBar } from "../components/layout/TitleBar";
import DashboardListTable from "@/components/dahboards/DashboardListTable";
import { Card, CardContent } from "@/components/ui/card";

const DashboardListingPage: NextPageWithLayout = () => {
  return (
    <div className="p-4 lg:p-8">
      <h1 className="text-2xl font-bold text-stone-700 md:hidden">
        Dashboard List
      </h1>
      <TitleBar title="Dashboards" />
      <div className="flex py-4 pt-6 lg:hidden">
        <Input
          placeholder="Find pipeline"
          className="rounded-r-none bg-white"
        />
        <Button type="submit" className="my-auto rounded-l-none bg-stone-800">
          Search
        </Button>
      </div>

      <div className="hidden py-4 lg:block">
        <Card
          className={
            "h-full w-full rounded-md border border-slate-300 shadow-sm"
          }
        >
          <CardContent className="p-3">
            <DashboardListTable
              dashboardEntries={[
                {
                  id: "1",
                  name: "Dashboard 1",
                  description:
                    "This is a sample description of the dashboard. It describes what the dashboard does with more detail",
                  url: "https://example.com",
                },
                {
                  id: "2",
                  name: "Dashboard 2",
                  description:
                    "This is a sample description of the dashboard. It describes what the dashboard does with more detail",
                  url: "https://example2.com",
                },
              ]}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

DashboardListingPage.getLayout = function getLayout(page: ReactElement) {
  return <DashboardLayout>{page}</DashboardLayout>;
};

export default DashboardListingPage;
