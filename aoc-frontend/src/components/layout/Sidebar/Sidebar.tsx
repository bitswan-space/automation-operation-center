import { Suspense } from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
  SidebarGroupLabel
} from "@/components/ui/sidebar";

import { Cog, Server, LayoutDashboard, Table, Network, Settings, Loader2 } from "lucide-react";
import NavTreeView from "./NavTreeView";
import { SidebarFooterMenu } from "./SidebarFooterMenu";
import { SidebarMenuLogo } from "./SidebarMenuLogo";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "react-router-dom";
import { OrgSwitcher } from "@/components/organizations/org-switcher";
import ProfileSelector from "@/components/groups/ProfileSelector";
import { useAdminStatus } from "@/hooks/useAdminStatus";
import { User } from "@/context/AuthContext";
import { useAutomationsCounts } from "@/hooks/useAutomationsCounts";
import { useMQTTTokens } from "@/context/MQTTTokensProvider";

type AppSidebarProps = {
  user: User;
  path?: string;
};

export function AppSidebar(props: AppSidebarProps) {
  const { user, path } = props;
  const { isAdmin } = useAdminStatus();
  const { 
    automationCount, 
    automationServerCount, 
    workspaceCount, 
    isLoading 
  } = useAutomationsCounts();
  const { tokens, isLoading: tokensLoading } = useMQTTTokens();
  const isMaker = (!tokensLoading && tokens && tokens.length > 0) || isAdmin;

  // Check if experimental features should be shown
  const showExperimental = true;

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuLogo />
          </SidebarMenuItem>
          <SidebarSeparator />
          <SidebarMenuItem key={"orgs"}>
            <OrgSwitcher />
          </SidebarMenuItem>
          <SidebarMenuItem key={"profiles"}>
            <ProfileSelector />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem key={"dashboard"}>
                <SidebarMenuButton asChild isActive={path === "/dashboard"}>
                  <Link to={"/dashboard"}>
                    <LayoutDashboard />
                    <span>{"Dashboard"}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              {isMaker && (
              <>
              {isAdmin && (
                <SidebarMenuItem key={"automation-servers"}>
                  <SidebarMenuButton asChild isActive={path === "/automation-servers"}>
                    <Link to={"/automation-servers"}>
                      <Server />
                      <span>{"Servers"}</span>
                      <span className="ml-auto text-xs">
                        { isLoading ? <Loader2 size={16} className="animate-spin ml-1" /> : automationServerCount}
                      </span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
              {showExperimental && (
                <>
                  <SidebarMenuItem key={"workspaces"}>
                    <SidebarMenuButton asChild isActive={path === "/workspaces"}>
                      <Link to={"/workspaces"}>
                        <Table />
                        <span>{"Workspaces"}</span>
                        <span className="ml-auto text-xs">
                          { isLoading ? <Loader2 size={16} className="animate-spin ml-1" /> : workspaceCount}
                        </span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem key={"processes"}>
                    <SidebarMenuButton asChild>
                      <Link to={"/dashboard/processes"}>
                        <Network />
                        <span>{"Processes"}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </>
              )}
              <SidebarMenuItem key={"automations"}>
                <SidebarMenuButton asChild isActive={path === "/automations"}>
                  <Link to={"/automations"}>
                    <Cog />
                    <span>{"Automations"}</span>
                    <span className="ml-auto text-xs">
                      { isLoading ? <Loader2 size={16} className="animate-spin ml-1" /> : automationCount}
                    </span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              {isAdmin && (
                <SidebarMenuItem key={"settings"}>
                  <SidebarMenuButton asChild isActive={path === "/settings"}>
                    <Link to={"/settings"}>
                      <Settings />
                      <span>{"Settings"}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
              </>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarSeparator />
        <SidebarGroup>
          <SidebarGroupLabel>SHORTCUTS</SidebarGroupLabel>
          <SidebarGroupContent>
            <Suspense
              fallback={
                <div className="p-2">
                  <Skeleton className="h-40 w-full" />
                </div>
              }
            >
              <NavTreeView />
            </Suspense>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarFooterMenu
              name={user?.name}
              email={user?.email}
            />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}