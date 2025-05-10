import { ArrowLeft, ArrowUpRight, Server, Users, Zap } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";

import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import Link from "next/link";
import { formatRelative } from "date-fns";
import { type Workspace } from "@/data/automation-server";


const automationsList = [
  {
    id: "auto-101",
    name: "Product Analytics",
    workspace: "Product",
    lastRun: "2 hours ago",
    status: "completed",
    nextRun: "Tomorrow at 6:00 AM",
    },
    {
      id: "auto-102",
      name: "Support Ticket Routing",
      workspace: "Support",
      lastRun: "10 minutes ago",
      status: "completed",
      nextRun: "Hourly",
    },
    {
      id: "auto-103",
      name: "Infrastructure Monitoring",
      workspace: "Operations",
      lastRun: "5 minutes ago",
    status: "running",
    nextRun: "Every 15 minutes",
  },
];

type WorkspaceDetailSectionProps = {
  workspace?: Workspace;
};

export function WorkspaceDetailSection(
  props: WorkspaceDetailSectionProps,
) {
  const { workspace } = props;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
      case "completed":
        return (
          <Badge className="border-green-200 bg-green-100 text-green-700 hover:bg-green-100">
            {status}
          </Badge>
        );
      case "running":
        return (
          <Badge className="border-blue-200 bg-blue-100 text-blue-700 hover:bg-blue-100">
            {status}
          </Badge>
        );
      case "failed":
        return (
          <Badge className="border-red-200 bg-red-100 text-red-700 hover:bg-red-100">
            {status}
          </Badge>
        );
      default:
        return (
          <Badge className="border-gray-200 bg-gray-100 text-gray-700 hover:bg-gray-100">
            {status}
          </Badge>
        );
    }
  };

  return (
    <div className="container mx-auto flex-1 px-0 py-4">
      <header className="rounded-md border border-slate-300 bg-white p-4 px-0 shadow-sm">
        <div className="container mx-auto">
          <div className="mb-4 flex items-center">
            <Button variant="ghost" size="sm" asChild className="mr-2">
              <Link href={`/dashboard/automation-servers/${workspace?.automation_server}`}>
                <ArrowLeft className="mr-1 h-4 w-4" />
                Back to server
              </Link>
            </Button>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="mr-3 flex h-10 w-10 items-center justify-center rounded bg-blue-100 text-blue-600">
                <Server className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold text-gray-900">
                  {workspace?.name}
                </h1>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <span>
                    56 automations
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>
      <Card className="rounded-md border border-slate-300 shadow-none mt-4">
            <CardHeader>
              <CardTitle>Automations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Workspace</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Last Run</TableHead>
                      <TableHead className="text-right">Next Run</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {automationsList.map((automation) => (
                      <TableRow key={automation.id}>
                        <TableCell className="font-medium">
                          {automation.name}
                        </TableCell>
                        <TableCell>{automation.workspace}</TableCell>
                        <TableCell>
                          {getStatusBadge(automation.status)}
                        </TableCell>
                        <TableCell className="text-right">
                          {automation.lastRun}
                        </TableCell>
                        <TableCell className="text-right">
                          {automation.nextRun}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
    </div>
  );
}
