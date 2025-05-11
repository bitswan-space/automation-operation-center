import React, { Suspense } from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

import { Server, Zap } from "lucide-react";
import NavTreeView from "./NavTreeView";
import { type Session } from "next-auth";
import { SidebarFooterMenu } from "./SidebarFooterMenu";
import { SidebarMenuLogo } from "./SidebarMenuLogo";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";

type AppSidebarProps = {
  session?: Session | null;
};

export function AppSidebar(props: AppSidebarProps) {
  const { session } = props;

  return (
    <Sidebar className="dark" collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuLogo />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent className="text-neutral-200">
        <SidebarGroup>
          <SidebarGroupLabel>Main Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem key={"automations"}>
                <SidebarMenuButton asChild>
                  <Link href={"/dashboard/automations"}>
                    <Zap />
                    <span>{"Automations"}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem key={"automation-servers"}>
                <SidebarMenuButton asChild>
                  <Link href={"/dashboard/automation-servers"}>
                    <Server />
                    <span>{"Automation Servers"}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>Platform</SidebarGroupLabel>
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
      <SidebarFooter className="text-neutral-200">
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
