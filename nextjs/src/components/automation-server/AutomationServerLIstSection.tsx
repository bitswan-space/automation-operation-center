"use client";

import { Card, CardContent } from "../ui/card";
import {
  ExternalLink,
  Search,
  Server,
  Settings,
  RotateCcw,
} from "lucide-react";

import { type AutomationServer } from "@/data/automation-server";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import Link from "next/link";
import React from "react";
import { useAutomations } from "@/context/AutomationsProvider";
type AutomationServerListSectionProps = {
  servers: AutomationServer[];
};

export function AutomationServerListSection(
  props: AutomationServerListSectionProps,
) {
  const { servers } = props;
  const { automationServers: automationServersGroup } = useAutomations();

  const [searchQuery, setSearchQuery] = React.useState("");

  const filteredServers = servers.filter((server) =>
    server.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="container mx-auto flex-1 px-0 py-4">
      <div className="mb-4 flex items-center justify-between">
        <div className="relative w-64">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            type="search"
            placeholder="Search servers..."
            className="border-gray-300 bg-white pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700">
          <RotateCcw size={20} /> Refresh
        </Button>
      </div>

      {filteredServers.length === 0 ? (
        <div className="py-8 text-center text-gray-500">
          No servers found matching your search.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredServers.map((server) => (
            <Card
              key={server.id}
              className="overflow-hidden rounded-md border-gray-200 shadow-sm transition-shadow hover:shadow"
            >
              <CardContent className="p-0">
                <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50 px-4 py-3">
                  <div className="flex items-center">
                    <div className="mr-3 flex h-8 w-8 items-center justify-center rounded bg-blue-100 text-xs text-blue-600">
                      <Server className="h-4 w-4" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">
                        {server.name}
                      </h3>
                      <p className="text-xs text-gray-500">
                        {server.automation_server_id}
                      </p>
                    </div>
                  </div>
                  {server.is_connected ? (
                    <Badge className="border-green-200 bg-green-100 text-green-700 hover:bg-green-100">
                      Connected
                    </Badge>
                  ) : (
                    <Badge className="border-gray-200 bg-gray-100 text-gray-600 hover:bg-gray-100">
                      Disconnected
                    </Badge>
                  )}
                </div>

                <div className="px-4 py-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="mb-1 text-xs text-gray-500">Workspaces</p>
                      <p className="text-lg font-semibold">
                        {server.workspaces?.length}
                      </p>
                    </div>
                    <div>
                      <p className="mb-1 text-xs text-gray-500">Automations</p>
                      <p className="text-lg font-semibold">
                        {automationServersGroup[server.automation_server_id]?.pipelines.length}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-gray-100 bg-gray-50 px-4 py-3">
                  <span className="text-xs text-gray-500">
                    Created {server.created_at}
                  </span>
                  <div className="flex gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                    >
                      <Settings className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                      asChild
                    >
                      <Link href={`/dashboard/automation-servers/${server.automation_server_id}`}>
                        <ExternalLink className="h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
