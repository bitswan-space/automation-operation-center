"use client";

import { Card, CardContent } from "../ui/card";
import { Search, Loader2 } from "lucide-react";

import { type AutomationServer } from "@/data/automation-server";
import { Badge } from "../ui/badge";
import { Input } from "../ui/input";
import { Link } from "react-router-dom";
import React from "react";
import { useAutomations } from "@/context/AutomationsProvider";
import { Button } from "../ui/button";

type AutomationServerListSectionProps = {
  servers: AutomationServer[];
  highlightedServerId: string | null;
};

export function AutomationServerListSection(
  props: AutomationServerListSectionProps,
) {
  const { servers, highlightedServerId } = props;
  const { automationServers: automationServersGroup, isLoading, processes } = useAutomations();

  const [searchQuery, setSearchQuery] = React.useState("");

  const filteredServers = servers.filter((server) =>
    server.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const getProcessCount = (serverId: string) => {
    if (!processes) return 0;
    return Object.values(processes).filter(
      (process) => process.automation_server_id === serverId
    ).length;
  };

  return (
    <div className="mx-auto flex-1 px-0 py-4">
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
      </div>

      {filteredServers.length === 0 ? (
        <div className="py-8 text-center text-gray-500">
          No servers found matching your search.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredServers.map((server) => {
            const isHighlighted = highlightedServerId === server.automation_server_id;
            return (
              <Card key={server.id} className={`${
                isHighlighted 
                  ? 'ring-2 ring-green-500 ring-opacity-50 bg-green-50 border-green-200' 
                  : ''
              }`}>
                <CardContent className="p-0">
                  <div className="flex items-start justify-between px-4 py-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-1">
                        {server.name}
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        {server.automation_server_id}
                      </p>
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

                  <div className="px-4 py-4">
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <p className="mb-1 text-xs text-muted-foreground font-semibold">Workspaces</p>
                        <p className="text-2xl font-semibold">
                          {server.workspaces?.length ?? 0}
                        </p>
                      </div>
                      <div>
                        <p className="mb-1 text-xs text-muted-foreground font-semibold">Processes</p>
                        <p className="text-2xl font-semibold">
                          {isLoading ? <Loader2 size={22} className="animate-spin mb-1" /> : getProcessCount(server.automation_server_id)}
                        </p>
                      </div>
                      <div>
                        <p className="mb-1 text-xs text-muted-foreground font-semibold">
                          Automations
                        </p>
                        <p className="text-2xl font-semibold">
                          {isLoading ? (
                            <Loader2 size={22} className="animate-spin mb-1" />
                          ) : (
                            automationServersGroup[server.automation_server_id]
                              ?.pipelines.length ?? 0
                          )}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="border-t px-6 py-4">
                    <Link to={`/automation-servers/${server.automation_server_id}`} className="block">
                      <Button 
                        variant="outline"
                      >
                        See workspaces
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}