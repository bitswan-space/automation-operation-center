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
import { redirect } from "next/navigation";

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
    redirect("/api/keycloak-logout");
  }

  return (
    <SidebarProvider>
      <SidebarItemsProvider>
        {/* Sidebar */}
        <AppSidebar session={session} />
        <SidebarRail />
        <AutomationsProvider>
          <SidebarInset className="bg-neutral-200/50">
            <div className="flex p-4 lg:pl-0 lg:pr-8">
              <SidebarTrigger className="mx-2 mt-1" />
              {children}
            </div>
          </SidebarInset>
        </AutomationsProvider>
        <Toaster />
      </SidebarItemsProvider>
    </SidebarProvider>
  );
}
