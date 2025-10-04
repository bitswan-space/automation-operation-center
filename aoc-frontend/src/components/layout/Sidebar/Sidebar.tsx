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
} from "@/components/ui/sidebar";

import { Cog, Server, LayoutDashboard, Table, Network, Settings } from "lucide-react";
import NavTreeView from "./NavTreeView";
import { SidebarFooterMenu } from "./SidebarFooterMenu";
import { SidebarMenuLogo } from "./SidebarMenuLogo";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "react-router-dom";
import { OrgSwitcher } from "@/components/organizations/org-switcher";
import ProfileSelector from "@/components/groups/ProfileSelector";
import { useAdminStatus } from "@/hooks/useAdminStatus";
import { User } from "@/context/AuthContext";

type AppSidebarProps = {
  user: User;
};

export function AppSidebar(props: AppSidebarProps) {
  const { user } = props;
  const { isAdmin } = useAdminStatus();
  
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
                <SidebarMenuButton asChild>
                  <Link to={"/dashboard"}>
                    <LayoutDashboard />
                    <span>{"Dashboard"}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              {isAdmin && (
                <SidebarMenuItem key={"automation-servers"}>
                  <SidebarMenuButton asChild>
                    <Link to={"/automation-servers"}>
                      <Server />
                      <span>{"Servers"}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
              {showExperimental && (
                <>
                  <SidebarMenuItem key={"workspaces"}>
                    <SidebarMenuButton asChild>
                      <Link to={"/dashboard/workspaces"}>
                        <Table />
                        <span>{"Workspaces"}</span>
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
                <SidebarMenuButton asChild>
                  <Link to={"/automations"}>
                    <Cog />
                    <span>{"Automations"}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              {isAdmin && (
                <SidebarMenuItem key={"settings"}>
                  <SidebarMenuButton asChild>
                    <Link to={"/settings"}>
                      <Settings />
                      <span>{"Settings"}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarSeparator />
        <SidebarGroup>
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