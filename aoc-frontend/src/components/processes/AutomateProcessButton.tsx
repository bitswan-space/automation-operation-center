import { useState, useMemo } from "react";
import { Plus, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "../ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";
import MQTTService from "@/services/MQTTService";
import { useAutomations } from "@/context/AutomationsProvider";

type AutomateProcessButtonProps = {
  workspaceId?: string;
  automationServerId?: string;
};

export default function AutomateProcessButton(props: AutomateProcessButtonProps) {
  const { workspaceId, automationServerId } = props;
  const { automationServers } = useAutomations();
  const navigate = useNavigate();
  const workspaces = Object.values(automationServers).flatMap(server => Object.values(server.workspaces));
  const [open, setOpen] = useState(false);
  const [processName, setProcessName] = useState("");
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string>("");
  const [selectedAutomationServerId, setSelectedAutomationServerId] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");

  const needsWorkspaceSelection = !workspaceId || !automationServerId;
  const finalWorkspaceId = workspaceId || selectedWorkspaceId;
  const finalAutomationServerId = automationServerId || selectedAutomationServerId;

  // Filter workspaces based on search query
  const filteredWorkspaces = useMemo(() => {
    if (!searchQuery.trim()) {
      return workspaces;
    }
    const query = searchQuery.toLowerCase();
    return workspaces.filter((workspace) =>
      workspace.workspace.name.toLowerCase().includes(query)
    );
  }, [workspaces, searchQuery]);

  const handleWorkspaceChange = (value: string) => {
    const [serverId, wsId] = value.split("|");
    setSelectedAutomationServerId(serverId);
    setSelectedWorkspaceId(wsId);
  };

  const handleContinue = () => {
    if (processName.trim() && finalWorkspaceId && finalAutomationServerId) {
      const processId = MQTTService.getInstance().createProcess(processName.trim(), finalWorkspaceId, finalAutomationServerId);
      setProcessName("");
      setSelectedWorkspaceId("");
      setSelectedAutomationServerId("");
      setOpen(false);
      
      // Redirect to process detail page after a small delay
      setTimeout(() => {
        navigate(`/workspaces/${finalWorkspaceId}/processes/${processId}`);
      }, 500); // 500ms delay
    }
  };

  const handleCancel = () => {
    setProcessName("");
    setSelectedWorkspaceId("");
    setSelectedAutomationServerId("");
    setOpen(false);
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      // Reset state when dialog closes
      setProcessName("");
      setSelectedWorkspaceId("");
      setSelectedAutomationServerId("");
      setSearchQuery("");
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <Plus size={16} />
          Automate process
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Name the process</DialogTitle>
        </DialogHeader>
        <div className="py-4 space-y-4">
          <div>
            <Input
              placeholder="Process name..."
              value={processName}
              onChange={(e) => setProcessName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && processName.trim() && (!needsWorkspaceSelection || (selectedWorkspaceId && selectedAutomationServerId))) {
                  handleContinue();
                }
              }}
              autoFocus
            />
          </div>
          {needsWorkspaceSelection && (
            <div className="space-y-3">
              <Label>
                Choose a workspace for this process <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  type="search"
                  placeholder="Search workspaces..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <RadioGroup
                value={selectedWorkspaceId && selectedAutomationServerId ? `${selectedAutomationServerId}|${selectedWorkspaceId}` : ""}
                onValueChange={handleWorkspaceChange}
              >
                <div className="space-y-2 min-h-[200px] max-h-[60vh] overflow-y-auto">
                  {filteredWorkspaces.length === 0 ? (
                    <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
                      No workspaces found
                    </div>
                  ) : (
                    filteredWorkspaces.map((workspace) => (
                      <div key={`${workspace.automationServerId}-${workspace.workspaceId}`} className="flex items-center space-x-2">
                        <RadioGroupItem
                          value={`${workspace.automationServerId}|${workspace.workspaceId}`}
                          id={`workspace-${workspace.workspaceId}`}
                        />
                        <Label
                          htmlFor={`workspace-${workspace.workspaceId}`}
                          className="font-normal cursor-pointer"
                        >
                          {workspace.workspace.name}
                        </Label>
                      </div>
                    ))
                  )}
                </div>
              </RadioGroup>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button
            onClick={handleContinue}
            disabled={!processName.trim() || (needsWorkspaceSelection && (!selectedWorkspaceId || !selectedAutomationServerId))}
          >
            Continue
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
