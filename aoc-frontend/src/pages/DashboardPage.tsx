import PanelItemsSection from "@/components/home/PanelItemsSection";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useTitleBar } from "@/context/TitleBarProvider";
import { useAutomationsCounts } from "@/hooks/useAutomationsCounts";
import { LayoutDashboard, Loader2, Plus } from "lucide-react";
import { useEffect } from "react";

export default function DashboardPage() {
  const { setTitle, setIcon, setButtons } = useTitleBar();
  const { 
    automationCount, 
    runningAutomationCount, 
    pausedAutomationCount, 
    isLoading 
  } = useAutomationsCounts();
  
  useEffect(() => {
    setTitle("Dashboard");
    setIcon(<LayoutDashboard size={24} />);
    setButtons(
      <Button>
        <Plus size={16} />
        Automate processes
      </Button>
    );
  }, [setTitle, setIcon, setButtons]);

  return (
    <div>
      {/* Statistics Overview Section */}
      <div className="flex items-center justify-between mb-7 mt-6">
        <div className="flex-1 text-center">
          <div className="text-sm text-muted-foreground">Total automations</div>
          <div className="text-3xl font-semibold">
            {isLoading ? <Loader2 size={24} className="animate-spin" /> : automationCount}
          </div>
        </div>
        <Separator orientation="vertical" className="h-[60px]" />
        <div className="flex-1 text-center">
          <div className="text-sm text-muted-foreground">Running automations</div>
          <div className="text-3xl font-semibold">
            {isLoading ? <Loader2 size={24} className="animate-spin" /> : runningAutomationCount}
          </div>
        </div>
        <Separator orientation="vertical" className="h-[60px]" />
        <div className="flex-1 text-center">
          <div className="text-sm text-muted-foreground">Paused automations</div>
          <div className="text-3xl font-semibold">
            {isLoading ? <Loader2 size={24} className="animate-spin" /> : pausedAutomationCount}
          </div>
        </div>
      </div>

      {/* Shortcuts Section */}
      <div className="mt-5">
        <div className="flex items-center gap-2 mb-5">
          <Separator className="flex-1"/>
          <h2 className="font-medium whitespace-nowrap">Shortcuts</h2>
          <Separator className="flex-1"/>
        </div>
        <div>
          <PanelItemsSection />
        </div>
      </div>
    </div>
  );
}
