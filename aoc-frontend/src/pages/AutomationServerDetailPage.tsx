import { AutomationServerDetailSection } from "@/components/automation-server/AutomationServerDetailSection";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import React, { useEffect, useState } from "react";
import { getAutomationServers } from "@/data/automation-server";
import { fetchOrgGroups } from "@/data/groups";
import { useParams } from "react-router-dom";
import { useTitleBar } from "@/context/TitleBarProvider";
import { Server } from "lucide-react";
import { type AutomationServer } from "@/data/automation-server";
import { type UserGroup } from "@/data/groups";

const AutomationServerDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const [automationServer, setAutomationServer] = useState<AutomationServer | null>(null);
  const [groupsList, setGroupsList] = useState<UserGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const { setTitle, setIcon } = useTitleBar();

  useEffect(() => {
    setTitle("Automation Servers");
    setIcon(<Server size={24} />);
  }, [setTitle, setIcon]);

  // Optimistic update functions
  const updateAutomationServerGroups = (userId: string, groupId: string, action: 'add' | 'remove') => {
    setAutomationServer(prevServer => {
      if (!prevServer) return prevServer;
      
      const groupToAdd = groupsList.find(g => g.id === groupId);
      if (!groupToAdd) return prevServer;

      if (action === 'add') {
        // Check if group is already a member
        const isAlreadyMember = prevServer.group_memberships?.find(
          (g) => g.keycloak_group_id === groupId
        );
        if (isAlreadyMember) return prevServer;

        return {
          ...prevServer,
          group_memberships: [
            ...(prevServer.group_memberships || []),
            { 
              id: Date.now(), // Temporary ID for optimistic update
              automation_server: prevServer.automation_server_id,
              keycloak_group_id: groupId 
            }
          ]
        };
      } else if (action === 'remove') {
        return {
          ...prevServer,
          group_memberships: (prevServer.group_memberships || []).filter(
            (g) => g.keycloak_group_id !== groupId
          )
        };
      }
      return prevServer;
    });
  };

  const updateWorkspaceGroups = (userId: string, groupId: string, action: 'add' | 'remove') => {
    setAutomationServer(prevServer => {
      if (!prevServer) return prevServer;
      
      const groupToAdd = groupsList.find(g => g.id === groupId);
      if (!groupToAdd) return prevServer;

      return {
        ...prevServer,
        workspaces: prevServer.workspaces?.map(workspace => {
          if (workspace.id !== userId) return workspace;

          if (action === 'add') {
            // Check if group is already a member
            const isAlreadyMember = workspace.group_memberships?.find(
              (g) => g.keycloak_group_id === groupId
            );
            if (isAlreadyMember) return workspace;

            return {
              ...workspace,
              group_memberships: [
                ...(workspace.group_memberships || []),
                { 
                  id: Date.now(), // Temporary ID for optimistic update
                  workspace: workspace.id,
                  keycloak_group_id: groupId 
                }
              ]
            };
          } else if (action === 'remove') {
            return {
              ...workspace,
              group_memberships: (workspace.group_memberships || []).filter(
                (g) => g.keycloak_group_id !== groupId
              )
            };
          }
          return workspace;
        }) || []
      };
    });
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        const [serversData, groupsData] = await Promise.all([
          getAutomationServers(),
          fetchOrgGroups(),
        ]);

        const server = serversData.results.find(
          (server: any) => server.automation_server_id === id,
        );

        setAutomationServer(server);
        setGroupsList(groupsData.results ?? []);
      } catch (error) {
        console.error("Error loading automation server data:", error);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      loadData();
    }
  }, [id]);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="w-full">
      <h1 className="text-2xl font-bold text-stone-700 md:hidden">
        Automation Servers
      </h1>
      <div className="flex py-4 pt-6 lg:hidden">
        <Input
          placeholder="Find automation"
          className="rounded-r-none bg-white"
        />
        <Button type="submit" className="my-auto rounded-l-none bg-stone-800">
          Search
        </Button>
      </div>
      <AutomationServerDetailSection
        server={automationServer}
        groupsList={groupsList}
        onAutomationServerGroupUpdate={updateAutomationServerGroups}
        onWorkspaceGroupUpdate={updateWorkspaceGroups}
      />
    </div>
  );
}

export default AutomationServerDetailPage;