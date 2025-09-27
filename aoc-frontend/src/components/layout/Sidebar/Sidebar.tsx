import React, { Suspense } from "react";
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
import { type Organisation } from "@/data/organisations";

type AppSidebarProps = {
  session?: any;
  orgs: Organisation[];
  activeOrg?: Organisation;
};

export function AppSidebar(props: AppSidebarProps) {
  const { session, orgs, activeOrg } = props;
  
  // Check if experimental features should be shown
  const showExperimental = process.env.REACT_APP_BITSWAN_EXPERIMENTAL?.toLowerCase() === 'true';

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuLogo />
          </SidebarMenuItem>
          <SidebarSeparator />
          <SidebarMenuItem key={"orgs"}>
            <OrgSwitcher orgs={orgs} activeOrg={activeOrg} />
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
              <SidebarMenuItem key={"automation-servers"}>
                <SidebarMenuButton asChild>
                  <Link to={"/automation-servers"}>
                    <Server />
                    <span>{"Servers"}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
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
              <SidebarMenuItem key={"settings"}>
                <SidebarMenuButton asChild>
                  <Link to={"/settings"}>
                    <Settings />
                    <span>{"Settings"}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
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
              name={session?.user?.name}
              email={session?.user?.email}
            />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}