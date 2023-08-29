import { Card, CardContent, CardFooter } from "../ui/card";

import { Button } from "../ui/button";
import { type ReactNode } from "react";
import { Separator } from "../ui/separator";
import { Badge } from "../ui/badge";

interface PipelineDataCardProps {
  name: string;
  machineName: string;
  dateCreated: string;
}

function PipelineDataCard(props: PipelineDataCardProps) {
  const { name, machineName, dateCreated } = props;

  return (
    <Card className="rounded-md shadow-sm">
      <CardContent className="p-4 pb-4">
        <div className="flex flex-col gap-2 text-sm md:grid md:grid-cols-3">
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
      <Separator />
      <CardFooter className="px-4 pb-4 pt-4">
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

export { PipelineDataCard };
