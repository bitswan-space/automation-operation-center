import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import React, { useEffect, useState } from "react";
import { useTitleBar } from "@/context/TitleBarProvider";
import { getAutomationServers, type Workspace } from "@/data/automation-server";
import { WorkspaceDetailSection } from "@/components/workspaces/WorkspaceDetailSection";
import { useParams } from "react-router-dom";
import { Table } from "lucide-react";
import { fetchOrgGroups } from "@/data/groups";
import { type UserGroup } from "@/data/groups";

const WorkspaceDetailPage = () => {
  const { id, workspaceId } = useParams<{ id: string; workspaceId: string }>();
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [groupsList, setGroupsList] = useState<UserGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const { setTitle, setIcon } = useTitleBar();

  useEffect(() => {
    setTitle("Workspace Details");
    setIcon(<Table size={24} />);
  }, [setTitle, setIcon]);

  const updateWorkspaceGroups = (userId: string, groupId: string, action: 'add' | 'remove') => {
    setWorkspace(prevWorkspace => {
      if (!prevWorkspace) return prevWorkspace;
      
      const groupToAdd = groupsList.find(g => g.id === groupId);
      if (!groupToAdd) return prevWorkspace;

      if (action === 'add') {
        // Check if group is already a member
        const isAlreadyMember = prevWorkspace.group_memberships?.find(
          (g) => g.keycloak_group_id === groupId
        );
        if (isAlreadyMember) return prevWorkspace;

        return {
          ...prevWorkspace,
          group_memberships: [
            ...(prevWorkspace.group_memberships || []),
            { 
              id: Date.now(), // Temporary ID for optimistic update
              workspace: prevWorkspace.id,
              keycloak_group_id: groupId 
            }
          ]
        };
      } else if (action === 'remove') {
        return {
          ...prevWorkspace,
          group_memberships: (prevWorkspace.group_memberships || []).filter(
            (g) => g.keycloak_group_id !== groupId
          )
        };
      }
      return prevWorkspace;
    });
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        const [serversData, groupsData] = await Promise.all([
          getAutomationServers(),
          fetchOrgGroups(),
        ]);

        const automationServer = serversData.results.find(
          (server: any) => server.automation_server_id === id,
        );

        const workspaceData = automationServer?.workspaces?.find(
          (workspace: any) => workspace.id === workspaceId,
        );

        setWorkspace(workspaceData);
        setGroupsList(groupsData.results ?? []);
      } catch (error) {
        console.error("Error loading workspace data:", error);
      } finally {
        setLoading(false);
      }
    };

    if (id && workspaceId) {
      loadData();
    }
  }, [id, workspaceId]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!workspace) {
    return <div>Workspace not found</div>;
  }

  return (
    <div className="w-full">
      <h1 className="text-2xl font-bold text-stone-700 md:hidden">
        Workspace Details
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
      <WorkspaceDetailSection 
        workspace={workspace}
        groupsList={groupsList}
        onWorkspaceGroupUpdate={updateWorkspaceGroups}
      />
    </div>
  );
};

export default WorkspaceDetailPage;