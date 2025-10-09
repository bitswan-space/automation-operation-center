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
import { useVersion } from "@/hooks/useVersion";
import { useAdminStatus } from "@/hooks/useAdminStatus";
import { Copy, Check } from "lucide-react";
import { useState } from "react";

export default function DashboardLayout({ path }: { path?: string }) {
    const { user } = useAuth();
    const { version } = useVersion();
    const { isAdmin } = useAdminStatus();
    const [copied, setCopied] = useState(false);

    if (!user) {
        return null;
    }

    const handleCopyVersion = async () => {
        if (!version) return;
        
        // Construct the version URL endpoint
        const currentHost = window.location.hostname;
        const protocol = "https:";
        const backendHost = currentHost.replace(/^aoc\./, 'api.');
        const versionUrl = `${protocol}//${backendHost}/api/version`;
        
        // Format the command string
        const frontendVersion = version.aoc || 'unknown';
        const backendVersion = version['bitswan-backend'] || 'unknown';
        const commandString = `bitswan on-prem-aoc init --from ${versionUrl} # ${backendVersion} ${frontendVersion}`;
        
        try {
            await navigator.clipboard.writeText(commandString);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy to clipboard:', err);
        }
    };

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
                
                {/* Version footer */}
                {version && (
                    <footer className="py-1">
                        <div className="flex justify-center items-center gap-2">
                            <div className="text-[10px] text-muted-foreground/60 text-center">
                                {version.aoc && (
                                    <span className="mr-4">AOC: {version.aoc}</span>
                                )}
                                {version['bitswan-backend'] && (
                                    <span>Backend: {version['bitswan-backend']}</span>
                                )}
                            </div>
                            {isAdmin && (
                                <button
                                    onClick={handleCopyVersion}
                                    className="text-[10px] text-muted-foreground/60 hover:text-muted-foreground transition-colors"
                                    title="Copy init command"
                                >
                                    {copied ? (
                                        <Check className="h-3 w-3" />
                                    ) : (
                                        <Copy className="h-3 w-3" />
                                    )}
                                </button>
                            )}
                        </div>
                    </footer>
                )}
            </SidebarInset>
            <Toaster />
        </TitleBarProvider>
    );
}
