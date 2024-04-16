import DashboardLayout from "@/components/layout/DashboardLayout";
import { type NextPageWithLayout } from "./_app";
import { type ReactElement } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import React from "react";
import { TitleBar } from "../components/layout/TitleBar";
import DashboardListTable from "@/components/dashboards/DashboardListTable";
import { Card, CardContent } from "@/components/ui/card";
import { useDashboardEntryList } from "@/components/dashboards/hooks";
import { Skeleton } from "@/components/ui/skeleton";

const DashboardListingPage: NextPageWithLayout = () => {
  const dashboardEntryListQuery = useDashboardEntryList();
  return (
    <div className="p-4 lg:p-8">
      <h1 className="text-2xl font-bold text-stone-700 md:hidden">
        Dashboard Hub
      </h1>
      <TitleBar title="Dashboard Hub" />
      <div className="flex py-4 pt-6 lg:hidden">
        <Input
          placeholder="Find dashboard"
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
            {dashboardEntryListQuery.isSuccess && (
              <DashboardListTable
                dashboardEntries={dashboardEntryListQuery.data?.results ?? []}
              />
            )}
            {dashboardEntryListQuery.isLoading && (
              <div>
                <div className="flex justify-between pb-2">
                  <Skeleton className="h-8 w-1/3" />
                  <Skeleton className="h-8 w-1/5" />
                </div>
                <Skeleton className="h-[400px] w-full" />
              </div>
            )}
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
