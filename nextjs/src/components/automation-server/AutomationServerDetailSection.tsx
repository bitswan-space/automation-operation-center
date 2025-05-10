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
import { type AutomationServer } from "@/data/automation-server";
import { formatRelative } from "date-fns";

const automationServer = {
  id: "server-002",
  name: "production-server-2",
  version: "3.2.1",
  workspaces: 18,
  automations: 56,
  isConnected: true,
  lastUpdated: "5 minutes ago",
  workspacesList: [
    {
      id: "ws-101",
      name: "Product",
      automations: 14,
      lastActive: "15 minutes ago",
      status: "active",
    },
    {
      id: "ws-102",
      name: "Support",
      automations: 22,
      lastActive: "5 minutes ago",
      status: "active",
    },
    {
      id: "ws-103",
      name: "Operations",
      automations: 20,
      lastActive: "1 hour ago",
      status: "active",
    },
  ],
  automationsList: [
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
  ],
};

type AutomationServerDetailSectionProps = {
  server?: AutomationServer;
};

export function AutomationServerDetailSection(
  props: AutomationServerDetailSectionProps,
) {
  const { server } = props;

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
              <Link href="/dashboard/automation-servers">
                <ArrowLeft className="mr-1 h-4 w-4" />
                Back to servers
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
                  {server?.name}
                </h1>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <span>
                    {server?.workspaces?.length} workspace
                    {(server?.workspaces?.length ?? 0) > 1 && "s"}
                  </span>
                  <span>•</span>
                  <span>{automationServer.automations} automations</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {automationServer.isConnected ? (
                <Badge className="border-green-200 bg-green-100 text-green-700 hover:bg-green-100">
                  Connected
                </Badge>
              ) : (
                <Badge className="border-gray-200 bg-gray-100 text-gray-600 hover:bg-gray-100">
                  Disconnected
                </Badge>
              )}
            </div>
          </div>
        </div>
      </header>
      <Tabs defaultValue="workspaces" className="mt-6 space-y-4">
        <TabsList>
          <TabsTrigger value="workspaces" className="flex items-center">
            <Users className="mr-2 h-4 w-4" />
            Workspaces ({server?.workspaces?.length})
          </TabsTrigger>
          <TabsTrigger value="automations" className="flex items-center">
            <Zap className="mr-2 h-4 w-4" />
            Automations ({automationServer.automations})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="workspaces">
          <Card className="rounded-md border border-slate-300 shadow-none">
            <CardHeader>
              <CardTitle>Workspaces</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader className="bg-gray-100 text-gray-600">
                    <TableRow>
                      <TableHead>Name</TableHead>

                      <TableHead className="text-center">Automations</TableHead>
                      <TableHead className="text-right">Created</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {server?.workspaces?.map((workspace) => (
                      <TableRow key={workspace.id}>
                        <TableCell className="items-center text-blue-600 underline underline-offset-2">
                          <Link
                            className="flex items-center gap-1"
                            href={`/dashboard/automation-servers/${server.automation_server_id}/workspaces/${workspace.id}`}
                          >
                            {workspace.name}
                            <ArrowUpRight className="h-4 w-4" />
                          </Link>
                        </TableCell>
                        <TableCell className="text-center">{0}</TableCell>
                        <TableCell className="text-right font-medium">
                          {formatRelative(
                            new Date(workspace.created_at),
                            new Date(),
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="automations">
          <Card className="rounded-md border border-slate-300 shadow-none">
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
                    {automationServer.automationsList.map((automation) => (
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
        </TabsContent>
      </Tabs>
    </div>
  );
}
