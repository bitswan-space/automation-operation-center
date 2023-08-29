import DashboardLayout from "@/components/layout/DashboardLayout";
import { type NextPageWithLayout } from "./_app";
import { type ReactNode, type ReactElement } from "react";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const DashboardPage: NextPageWithLayout = () => {
  return (
    <>
      <div className="p-4">
        <h1 className="text-2xl font-bold text-stone-700">Running Pipelines</h1>
        <div className="flex py-4 pt-6">
          <Input
            placeholder="Find pipeline"
            className="rounded-r-none bg-white"
          />
          <Button
            type="submit"
            size={"sm"}
            className="my-auto rounded-l-none bg-stone-800"
          >
            Search
          </Button>
        </div>
        <div className="flex flex-col gap-2 md:hidden">
          <PipelineDataCard
            name="Pipeline 1"
            machineName="test_vm"
            dateCreated="2021-08-01"
          />
          <PipelineDataCard
            name="Pipeline 1"
            machineName="test_vm"
            dateCreated="2021-08-01"
          />
        </div>
      </div>
    </>
  );
};

DashboardPage.getLayout = function getLayout(page: ReactElement) {
  return <DashboardLayout>{page}</DashboardLayout>;
};

export default DashboardPage;

interface PipelineDataCardProps {
  name: string;
  machineName: string;
  dateCreated: string;
}

function PipelineDataCard(props: PipelineDataCardProps) {
  const { name, machineName, dateCreated } = props;

  return (
    <Card className="rounded-md shadow-sm">
      <CardContent className="p-4">
        <div className="flex flex-col gap-2 text-sm">
          <PipelineDataCardItem label="Name" value={name} />
          <PipelineDataCardItem label="Machine Name" value={machineName} />
          <PipelineDataCardItem
            label="Status"
            value={<Badge className="bg-green-600 shadow-none">Running</Badge>}
          />
          <PipelineDataCardItem label="Uptime" value="1h 30m" />
          <PipelineDataCardItem label="Date Created" value={dateCreated} />
        </div>
      </CardContent>
      <CardFooter className="px-4 pb-4">
        <Button className="w-full" variant={"outline"}>
          View
        </Button>
      </CardFooter>
    </Card>
  );
}

interface PipelineDataCardItemProps {
  label: string;
  value: ReactNode;
}

function PipelineDataCardItem(props: PipelineDataCardItemProps) {
  const { label, value } = props;

  return (
    <div className="space-x-2">
      <span className="font-semibold text-slate-800">{label}: </span>
      <span className="font-mono text-slate-600">{value}</span>
    </div>
  );
}
