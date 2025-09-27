import "@/styles/globals.css";

import {
  SidebarInset,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
} from "@/components/ui/sidebar";

import { AppSidebar } from "@/components/layout/Sidebar/Sidebar";
import { AutomationsProvider } from "@/context/AutomationsProvider";
import { SidebarItemsProvider } from "@/context/SideBarItemsProvider";
import { Toaster } from "sonner";
import { auth } from "@/server/auth";
import { env } from "@/env.mjs";
import { redirect } from "next/navigation";
import { fetchOrgs, getActiveOrgFromCookies } from "@/data/organisations";
import { getMQTTTokens } from "@/data/mqtt";
import { fetchProfiles } from "@/data/profiles";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session) {
    redirect("/api/auth/signin");
  }

  if (session.error === "RefreshAccessTokenError") {
    redirect("/auth/signout");
  }

  const profiles = await fetchProfiles();

  console.log("profiles", profiles.results);
  const orgs = await fetchOrgs();
  const activeOrg = await getActiveOrgFromCookies();

  const tokens = await getMQTTTokens();
  // console.log("tokens", tokens);

  return (
    <SidebarProvider>
      <SidebarItemsProvider>
        {/* Sidebar */}
        <AppSidebar session={session} orgs={orgs?.results ?? []} activeOrg={activeOrg} profiles={profiles?.results ?? []} />
        <SidebarRail />
        <AutomationsProvider tokens={tokens}>
          <SidebarInset>
            <header>
              <div className="border-border flex h-12 shrink-0 items-center gap-2 border-b px-4 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12 md:h-16">
                <SidebarTrigger className="-ml-1" />
              </div>
            </header>
            <div className="flex-1 py-0">
              <div className="flex items-center justify-between pb-1">
                {env.AOC_BUILD_NO && (
                  <div className="pr-4 text-xs font-medium">
                    Build · {env.AOC_BUILD_NO}
                  </div>
                )}
              </div>
              {children}
            </div>
          </SidebarInset>
        </AutomationsProvider>
        <Toaster />
      </SidebarItemsProvider>
    </SidebarProvider>
  );
}
