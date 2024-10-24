import "@/styles/globals.css";

import {
  SidebarInset,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
} from "@/components/ui/sidebar";

import { AppSidebar } from "@/components/layout/Sidebar/Sidebar";
import NextAuthProvider from "@/context/NextAuthProvider";
import { SideBarContextProvider } from "@/context/SideBarContextProvider";
import { SidebarItemsProvider } from "@/context/SideBarItemsProvider";
import { Toaster } from "sonner";
import { getServerAuthSession } from "@/server/auth";
import { redirect } from "next/navigation";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerAuthSession();

  if (!session) {
    redirect("/api/auth/signin");
  }
  return (
    <NextAuthProvider>
      <SideBarContextProvider>
        <SidebarProvider>
          <SidebarItemsProvider>
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
          </SidebarItemsProvider>
        </SidebarProvider>
      </SideBarContextProvider>
    </NextAuthProvider>
  );
}
