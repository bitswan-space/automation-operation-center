import "@/styles.css";

import {
    SidebarInset,
    SidebarRail,
    SidebarTrigger,
} from "@/components/ui/sidebar";

import { AppSidebar } from "@/components/layout/Sidebar/Sidebar";
import { Toaster } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { Outlet } from "react-router-dom";
import { TitleBarProvider } from "@/context/TitleBarProvider";
import { TitleBar } from "./TitleBar";

export default function DashboardLayout({ path }: { path?: string }) {
    const { user } = useAuth();

    if (!user) {
        return null;
    }

    return (
        <TitleBarProvider>
            {/* Sidebar */}
            <AppSidebar user={user} path={path} />
            <SidebarRail />
            <SidebarInset>
                <header>
                    <div className="border-border flex h-12 shrink-0 items-center gap-2 border-b px-4 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12 md:h-16">
                        <SidebarTrigger className="-ml-1" />
                    </div>
                    <TitleBar />
                </header>
                {/* Main content */}
                <div className="flex flex-1 flex-col gap-4 p-4">
                    <Outlet />
                </div>
            </SidebarInset>
            <Toaster />
        </TitleBarProvider>
    );
}
