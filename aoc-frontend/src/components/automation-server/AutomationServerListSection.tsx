"use client";

import { Card, CardContent } from "../ui/card";
import { Search, Server, RotateCcw, Loader2, Plus } from "lucide-react";

import { type AutomationServer } from "@/data/automation-server";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Link } from "react-router-dom";
import React from "react";
import { useAutomations } from "@/context/AutomationsProvider";
import { ConnectAutomationServerModal } from "./ConnectAutomationServerModal";
import { useAdminStatus } from "@/hooks/useAdminStatus";

type AutomationServerListSectionProps = {
  servers: AutomationServer[];
};

export function AutomationServerListSection(
  props: AutomationServerListSectionProps,
) {
  const { servers } = props;
  const { automationServers: automationServersGroup, isLoading } = useAutomations();
  const { isAdmin } = useAdminStatus();

  // Construct API URL for CLI commands (base backend URL without /api/frontend)
  const currentHost = window.location.hostname;
  const protocol = "https:";
  const backendHost = currentHost.replace(/^aoc\./, 'api.');
  const apiUrl = `${protocol}//${backendHost}/`;

  const [searchQuery, setSearchQuery] = React.useState("");
  const [highlightedServerId, setHighlightedServerId] = React.useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  // Handle server creation callback
  const handleServerCreated = (serverId: string) => {
    setHighlightedServerId(serverId);
    // Remove highlighting after 5 seconds
    setTimeout(() => {
      setHighlightedServerId(null);
    }, 5000);
    
    // Refresh the page to show the new server
    window.location.reload();
  };

  // Handle refresh
  const handleRefresh = () => {
    setIsRefreshing(true);
    window.location.reload();
  };

  const filteredServers = servers.filter((server) =>
    server.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

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
        <div className="flex gap-2">
          {isAdmin && (
            <ConnectAutomationServerModal 
              apiUrl={apiUrl}
              onServerCreated={handleServerCreated}
            >
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus size={20} className="mr-2" />
                Connect Automation Server
              </Button>
            </ConnectAutomationServerModal>
          )}
          <Button 
            className="bg-blue-600 hover:bg-blue-700"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            {isRefreshing ? (
              <Loader2 size={20} className="animate-spin" />
            ) : (
              <RotateCcw size={20} />
            )}
            Refresh
          </Button>
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
              <Link
                key={server.id}
                to={`/automation-servers/${server.automation_server_id}`}
              >
                <Card className={`overflow-hidden rounded-md border-gray-200 shadow-sm transition-all duration-500 hover:shadow ${
                  isHighlighted 
                    ? 'ring-2 ring-green-500 ring-opacity-50 bg-green-50 border-green-200' 
                    : ''
                }`}>
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
                          {server.workspaces?.length ?? 0}
                        </p>
                      </div>
                      <div>
                        <p className="mb-1 text-xs text-gray-500">
                          Automations
                        </p>
                        <p className="text-lg font-semibold">
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

                  <div className="flex items-center justify-between border-t border-gray-100 bg-gray-50 px-4 py-3">
                    <span className="text-xs text-gray-500">
                      Created {server.created_at}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}