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

import { Cog, Server, LayoutDashboard, Table, Network } from "lucide-react";
import NavTreeView from "./NavTreeView";
import { type Session } from "next-auth";
import { SidebarFooterMenu } from "./SidebarFooterMenu";
import { SidebarMenuLogo } from "./SidebarMenuLogo";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { OrgSwitcher } from "@/components/organizations/org-switcher";
import { type Organisation } from "@/data/organisations";
import { env } from "@/env.mjs";

type AppSidebarProps = {
  session?: Session | null;
  orgs: Organisation[];
  activeOrg?: Organisation;
};

export function AppSidebar(props: AppSidebarProps) {
  const { session, orgs, activeOrg } = props;
  
  // Check if experimental features should be shown
  const showExperimental = env.NEXT_PUBLIC_BITSWAN_EXPERIMENTAL?.toLowerCase() === 'true';

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
                  <Link href={"/dashboard"}>
                    <LayoutDashboard />
                    <span>{"Dashboard"}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem key={"automation-servers"}>
                <SidebarMenuButton asChild>
                  <Link href={"/dashboard/automation-servers"}>
                    <Server />
                    <span>{"Servers"}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              {showExperimental && (
                <>
                  <SidebarMenuItem key={"workspaces"}>
                    <SidebarMenuButton asChild>
                      <Link href={"/dashboard/workspaces"}>
                        <Table />
                        <span>{"Workspaces"}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem key={"processes"}>
                    <SidebarMenuButton asChild>
                      <Link href={"/dashboard/processes"}>
                        <Network />
                        <span>{"Processes"}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </>
              )}
              <SidebarMenuItem key={"automations"}>
                <SidebarMenuButton asChild>
                  <Link href={"/dashboard/automations"}>
                    <Cog />
                    <span>{"Automations"}</span>
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
              name={session?.user.name}
              email={session?.user.email}
            />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
