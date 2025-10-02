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

export default function DashboardLayout() {
    const { user } = useAuth();

    if (!user) {
        return null;
    }

    return (
        <>
            {/* Sidebar */}
            <AppSidebar user={user} />
            <SidebarRail />
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
            <Toaster />
        </>
    );
}
