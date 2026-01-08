import PanelItemsSection from "@/components/home/PanelItemsSection";
import { Separator } from "@/components/ui/separator";
import { useMQTTTokens } from "@/context/MQTTTokensProvider";
import { useSidebarItems } from "@/context/SideBarItemsProvider";
import { useTitleBar } from "@/context/TitleBarProvider";
import { useAutomationsCounts } from "@/hooks/useAutomationsCounts";
import { useAdminStatus } from "@/hooks/useAdminStatus";
import { LayoutDashboard, Loader2 } from "lucide-react";
import { useEffect } from "react";
import AutomateProcessButton from "@/components/processes/AutomateProcessButton";

export default function DashboardPage() {
  const { deserializedNavItems: sidebarItems } = useSidebarItems();
  const { tokens, isLoading: tokensLoading } = useMQTTTokens();
  const { setTitle, setIcon, setButtons } = useTitleBar();
  const { 
    automationCount, 
    runningAutomationCount,
    isLoading 
  } = useAutomationsCounts();
  const { isAdmin } = useAdminStatus();

  const isMaker = (!tokensLoading && tokens && tokens.length > 0) || isAdmin;
  
  useEffect(() => {
    setTitle("Dashboard");
    setIcon(<LayoutDashboard size={24} />);
    setButtons(
      isMaker && (
        <AutomateProcessButton />
      )
    );
  }, [setTitle, setIcon, setButtons, isMaker]);

  return (
    <div>
      {/* Statistics Overview Section */}
      {isMaker && 
        <div className="flex items-center justify-between mb-7 mt-6">
          <div className="flex-1 text-center">
            <div className="text-sm text-muted-foreground">Total automations</div>
            <div className="text-3xl font-semibold flex items-center justify-center">
              {isLoading ? <Loader2 size={24} className="animate-spin" /> : automationCount}
            </div>
          </div>
          <Separator orientation="vertical" className="h-[60px]" />
          <div className="flex-1 text-center">
            <div className="text-sm text-muted-foreground">Running automations</div>
            <div className="text-3xl font-semibold flex items-center justify-center">
              {isLoading ? <Loader2 size={24} className="animate-spin" /> : runningAutomationCount}
            </div>
          </div>
        </div>
      }

      {/* Shortcuts Section */}
      {sidebarItems && sidebarItems.length > 0 && 
        <div className="mt-5">
          <div className="flex items-center gap-2 mb-5">
            {isMaker && 
              <>
                <Separator className="flex-1"/>
                <h2 className="font-medium whitespace-nowrap">Shortcuts</h2>
                <Separator className="flex-1"/>
              </>
            }
          </div>
          <div>
            <PanelItemsSection />
          </div>
        </div>
      }

      {!isMaker && sidebarItems && sidebarItems.length === 0 && 
        <div className="mt-5">
          <div className="flex items-center gap-2 mb-5">
            <h2 className="font-medium whitespace-nowrap">You don't have access to any automations or shortcuts, please contact your admin.</h2>
          </div>
        </div>
      }
    </div>
  );
}
