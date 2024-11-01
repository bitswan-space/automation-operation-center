import "@/styles/globals.css";

import {
  SidebarInset,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
} from "@/components/ui/sidebar";

import { AppSidebar } from "@/components/layout/Sidebar/Sidebar";
import AuthCheck from "@/components/auth/auth-check";
import { SideBarContextProvider } from "@/context/SideBarContextProvider";
import { SidebarItemsProvider } from "@/context/SideBarItemsProvider";
import { Toaster } from "sonner";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SideBarContextProvider>
      <SidebarProvider>
        <SidebarItemsProvider>
          <AuthCheck>
            {/* Sidebar */}
            <AppSidebar />
            <SidebarRail />
            <SidebarInset className="bg-neutral-200/50 ">
              <div className="flex p-4 lg:pl-0 lg:pr-8">
                <SidebarTrigger className="mx-2 mt-1" />
                {children}
              </div>
            </SidebarInset>
            <Toaster />
          </AuthCheck>
        </SidebarItemsProvider>
      </SidebarProvider>
    </SideBarContextProvider>
  );
}
