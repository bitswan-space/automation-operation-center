import { Card, CardContent, CardFooter } from "../ui/card";

import { Button } from "../ui/button";
import { type ReactNode } from "react";
import { Separator } from "../ui/separator";
import { Badge } from "../ui/badge";
import Link from "next/link";
import { Eye, FileCog } from "lucide-react";

interface PipelineDataCardProps {
  id: string;
  name: string;
  machineName: string;
  dateCreated: Date;
  status: string;
  uptime: string;
}

function PipelineDataCard(props: PipelineDataCardProps) {
  const { name, machineName, dateCreated, status, uptime, id } = props;

  const createdAt = new Date(dateCreated)
    .toISOString()
    .slice(0, 16)
    .replace("T", ", ");

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "running":
        return <Badge className="bg-green-600 shadow-none">Running</Badge>;
      case "stopped":
        return <Badge className="bg-red-600 shadow-none">Stopped</Badge>;
    }
  };

  return (
    <Card className="rounded-md shadow-sm">
      <CardContent className="p-4 pb-4">
        <div className="flex flex-col gap-2 text-sm md:grid md:grid-cols-2">
          <PipelineDataCardItem label="Name" value={name} />
          <PipelineDataCardItem label="Machine Name" value={machineName} />
          <PipelineDataCardItem label="Status" value={getStatusBadge(status)} />
          <PipelineDataCardItem label="Uptime" value={uptime} />
          <PipelineDataCardItem label="Date Created" value={createdAt} />
        </div>
      </CardContent>
      <Separator />
      <CardFooter className="px-4 pb-4 pt-4">
        <div className="flex w-full flex-col gap-2">
          <Link href={`/pipelines/${id}`} className="w-full">
            <Button className="w-full" variant={"outline"}>
              <Eye size={22} className="mr-2" />
              View
            </Button>
          </Link>
          <Link
            href={`/pipelines/launch-pipeline-editor/${id}`}
            className="w-full"
          >
            <Button variant={"outline"} className="w-full">
              <FileCog size={22} className=" mr-2" />
              Launch Pipeline Editor
            </Button>
          </Link>
        </div>
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
