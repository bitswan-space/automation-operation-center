import { useState, useEffect } from "react";
import {
  useWorkspaceGroupsQuery,
  useWorkspaceNonMemberGroupsQuery,
  useAddWorkspaceToGroup,
  useRemoveWorkspaceFromGroup,
} from "@/hooks/useWorkspacesQuery";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Plus, X } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

type WorkspaceGroupsTabProps = {
  workspaceId: string;
};

export function WorkspaceGroupsTab({
  workspaceId,
}: WorkspaceGroupsTabProps) {
  const [addGroupOpen, setAddGroupOpen] = useState(false);
  const [addingGroupId, setAddingGroupId] = useState<string | null>(null);
  const [removingGroupId, setRemovingGroupId] = useState<string | null>(null);

  // Reset state when popover closes
  useEffect(() => {
    if (!addGroupOpen) {
      setAddingGroupId(null);
    }
  }, [addGroupOpen]);

  // Fetch workspace groups
  const {
    data: workspaceGroups,
    isLoading: isLoadingWorkspaceGroups,
  } = useWorkspaceGroupsQuery(workspaceId);

  // Fetch non-member groups for adding
  const {
    data: availableGroups = [],
    isLoading: isLoadingNonMemberGroups,
  } = useWorkspaceNonMemberGroupsQuery(workspaceId);

  const addToGroup = useAddWorkspaceToGroup(workspaceId);
  const removeFromGroup = useRemoveWorkspaceFromGroup(workspaceId);

  const handleAddGroup = (groupId: string) => {
    setAddingGroupId(groupId);
    addToGroup.mutate(groupId, {
      onSuccess: () => {
        toast.success("Workspace added to group successfully");
        setAddGroupOpen(false);
        setAddingGroupId(null);
      },
      onError: (error: any) => {
        toast.error(
          error?.message || "Failed to add workspace to group"
        );
        setAddingGroupId(null);
      },
    });
  };

  const handleRemoveGroup = (groupId: string) => {
    setRemovingGroupId(groupId);
    removeFromGroup.mutate(groupId, {
      onSuccess: () => {
        toast.success("Workspace removed from group successfully");
        setRemovingGroupId(null);
      },
      onError: (error: any) => {
        toast.error(
          error?.message || "Failed to remove workspace from group"
        );
        setRemovingGroupId(null);
      },
    });
  };

  return (
    <div className="flex flex-col flex-1 min-h-0 h-full">
      <div className="flex items-center justify-between flex-shrink-0 mb-4">
        <h3 className="text-sm font-medium">
          Workspace Groups ({workspaceGroups?.length ?? 0})
        </h3>
        <Popover open={addGroupOpen} onOpenChange={setAddGroupOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm">
              <Plus size={16} className="mr-2" />
              Add Group
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[400px] p-0" align="end">
            <Command>
              <CommandInput placeholder="Search groups..." />
              <CommandList>
                <CommandEmpty>
                  {isLoadingNonMemberGroups ? (
                    <div className="flex items-center justify-center p-4">
                      <Loader2 className="h-4 w-4 animate-spin" />
                    </div>
                  ) : (
                    "No groups found."
                  )}
                </CommandEmpty>
                <CommandGroup>
                  {availableGroups.map((group) => (
                    <CommandItem
                      key={group.id}
                      value={`${group.name} ${group.description || ""}`}
                      onSelect={() => handleAddGroup(group.id)}
                      disabled={
                        addToGroup.isPending || addingGroupId === group.id
                      }
                    >
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-2">
                          <Badge
                            variant="outline"
                            style={{
                              borderColor: group.tag_color || undefined,
                            }}
                          >
                            {group.name}
                          </Badge>
                          {group.description && (
                            <span className="text-xs text-muted-foreground">
                              {group.description}
                            </span>
                          )}
                        </div>
                        {addingGroupId === group.id && (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        )}
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className="space-y-2">
          {isLoadingWorkspaceGroups ? (
            <>
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </>
          ) : workspaceGroups && workspaceGroups.length > 0 ? (
            workspaceGroups.map((group) => (
              <div
                key={group.id}
                className="flex items-center justify-between p-3 border rounded-md"
              >
                <div className="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    style={{
                      borderColor: group.tag_color || undefined,
                    }}
                  >
                    {group.name}
                  </Badge>
                  {group.description && (
                    <span className="text-sm text-muted-foreground">
                      {group.description}
                    </span>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveGroup(group.id)}
                  disabled={
                    removeFromGroup.isPending || removingGroupId === group.id
                  }
                >
                  {removingGroupId === group.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <X size={16} />
                  )}
                </Button>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              No groups assigned to this workspace.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
