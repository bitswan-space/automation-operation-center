import { SidebarProvider } from "@/components/ui/sidebar";
import { AdminProvider } from "./AdminContext";
import { SidebarItemsProvider } from "./SideBarItemsProvider";
import { ReactFlowProvider } from "@xyflow/react";
import { AuthProvider } from "./AuthContext";
import { MQTTTokensProvider } from "./MQTTTokensProvider";
import { AutomationsProvider } from "./AutomationsProvider";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { OrgsProvider } from "./OrgsProvider";

import type { ReactNode } from "react";


const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            retry: 1,
            refetchOnWindowFocus: false,
        },
    },
});

export default function Providers({ children }: { children: ReactNode }) {
    return (
        <QueryClientProvider client={queryClient}>
            <ReactFlowProvider>
                <AuthProvider>
                    <AdminProvider>
                        <MQTTTokensProvider>
                            <OrgsProvider>
                                <SidebarProvider>
                                    <SidebarItemsProvider>
                                        <AutomationsProvider>
                                            {children}
                                        </AutomationsProvider>
                                    </SidebarItemsProvider>
                                </SidebarProvider>
                            </OrgsProvider>
                        </MQTTTokensProvider>
                    </AdminProvider>
                </AuthProvider>
            </ReactFlowProvider>
        </QueryClientProvider>
    );
}
