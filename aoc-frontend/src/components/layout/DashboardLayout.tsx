import "@/styles.css";

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
import { useAuth } from "@/context/AuthContext";
import { fetchOrgs, getActiveOrgFromCookies } from "@/data/organisations";
import { getMQTTTokens } from "@/data/mqtt";
import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";

export default function DashboardLayout() {
  const { user } = useAuth();
  const [orgs, setOrgs] = useState<any[]>([]);
  const [activeOrg, setActiveOrg] = useState<any>();
  const [tokens, setTokens] = useState<any[]>([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [orgsData, activeOrgData, tokensData] = await Promise.all([
          fetchOrgs(),
          getActiveOrgFromCookies(),
          getMQTTTokens(),
        ]);
        
        setOrgs(orgsData?.results ?? []);
        setActiveOrg(activeOrgData);
        setTokens(tokensData);
      } catch (error) {
        console.error("Error loading dashboard data:", error);
      }
    };

    loadData();
  }, []);

  if (!user) {
    return null;
  }

  return (
    <SidebarProvider>
      <SidebarItemsProvider>
        {/* Sidebar */}
        <AppSidebar session={{ user }} orgs={orgs} activeOrg={activeOrg} />
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
                {process.env.REACT_APP_AOC_BUILD_NO && (
                  <div className="pr-4 text-xs font-medium">
                    Build · {process.env.REACT_APP_AOC_BUILD_NO}
                  </div>
                )}
              </div>
              <Outlet />
            </div>
          </SidebarInset>
        </AutomationsProvider>
        <Toaster />
      </SidebarItemsProvider>
    </SidebarProvider>
  );
}