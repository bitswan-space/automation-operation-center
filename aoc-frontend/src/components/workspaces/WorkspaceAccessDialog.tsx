import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Ungroup } from "lucide-react";
import { WorkspaceGroupsTab } from "@/components/workspaces/WorkspaceGroupsTab";
import { WorkspaceUsersTab } from "@/components/workspaces/WorkspaceUsersTab";

type WorkspaceAccessDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspaceId: string;
};

export function WorkspaceAccessDialog({
  open,
  onOpenChange,
  workspaceId,
}: WorkspaceAccessDialogProps) {
  const [activeTab, setActiveTab] = useState("groups");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="h-[80vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>Manage Workspace Access</DialogTitle>
          <DialogDescription>
            Manage groups and users for this workspace.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 min-h-0 flex flex-col">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 min-h-0 flex flex-col">
            <TabsList className="flex-shrink-0">
              <TabsTrigger value="groups" className="flex-1 min-h-0">
                <Ungroup size={18} className="mr-2" />
                Groups
              </TabsTrigger>
              <TabsTrigger value="users" className="flex-1 min-h-0">
                <Users size={18} className="mr-2" />
                Users
              </TabsTrigger>
            </TabsList>
            <TabsContent value="groups" className="flex-1 min-h-0 mt-4">
              <WorkspaceGroupsTab workspaceId={workspaceId} />
            </TabsContent>
            <TabsContent value="users" className="flex-1 min-h-0 mt-4">
              <WorkspaceUsersTab workspaceId={workspaceId} />
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}
