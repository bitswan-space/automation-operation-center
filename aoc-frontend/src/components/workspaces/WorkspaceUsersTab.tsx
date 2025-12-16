import { useState, useEffect } from "react";
import {
  useWorkspaceUsersQuery,
  useWorkspaceNonMemberUsersQuery,
  useAddUserToWorkspace,
  useRemoveUserFromWorkspace,
} from "@/hooks/useWorkspacesQuery";
import { Users, Plus, Loader2, X } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { toast } from "sonner";

type WorkspaceUsersTabProps = {
  workspaceId: string;
};

export function WorkspaceUsersTab({
  workspaceId,
}: WorkspaceUsersTabProps) {
  const [addUserOpen, setAddUserOpen] = useState(false);
  const [addingUserId, setAddingUserId] = useState<string | null>(null);
  const [removingUserId, setRemovingUserId] = useState<string | null>(null);

  // Reset state when popover closes
  useEffect(() => {
    if (!addUserOpen) {
      setAddingUserId(null);
    }
  }, [addUserOpen]);

  // Fetch workspace users
  const {
    data: workspaceUsers,
    isLoading: isLoadingWorkspaceUsers,
  } = useWorkspaceUsersQuery(workspaceId);

  // Fetch non-member users for adding
  const {
    data: availableUsers = [],
    isLoading: isLoadingNonMemberUsers,
  } = useWorkspaceNonMemberUsersQuery(workspaceId);

  // Mutations for adding/removing users from workspace
  const addUserToWorkspaceMutation = useAddUserToWorkspace(workspaceId);
  const removeUserFromWorkspaceMutation = useRemoveUserFromWorkspace(workspaceId);

  const handleAddUser = (userId: string) => {
    setAddingUserId(userId);
    addUserToWorkspaceMutation.mutate(
      userId,
      {
        onSuccess: () => {
          toast.success("User added to workspace successfully");
          setAddUserOpen(false);
          setAddingUserId(null);
        },
        onError: (error: any) => {
          toast.error(error?.message || "Failed to add user to workspace");
          setAddingUserId(null);
        },
      }
    );
  };

  const handleRemoveUser = (userId: string) => {
    setRemovingUserId(userId);
    removeUserFromWorkspaceMutation.mutate(
      userId,
      {
        onSuccess: () => {
          toast.success("User removed from workspace successfully");
          setRemovingUserId(null);
        },
        onError: (error: any) => {
          toast.error(error?.message || "Failed to remove user from workspace");
          setRemovingUserId(null);
        },
      }
    );
  };

  return (
    <div className="flex flex-col flex-1 min-h-0 h-full">
      <div className="flex items-center justify-between flex-shrink-0 mb-4">
        <h3 className="text-sm font-medium">
          Workspace Users ({workspaceUsers?.length ?? 0})
        </h3>
        <Popover open={addUserOpen} onOpenChange={setAddUserOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm">
              <Plus size={16} className="mr-2" />
              Add User
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[400px] p-0" align="end">
            <Command>
              <CommandInput placeholder="Search users..." />
              <CommandList>
                <CommandEmpty>
                  {isLoadingNonMemberUsers ? (
                    <div className="flex items-center justify-center p-4">
                      <Loader2 className="h-4 w-4 animate-spin" />
                    </div>
                  ) : (
                    <div className="p-4 text-center text-sm text-muted-foreground">
                      No users found.
                    </div>
                  )}
                </CommandEmpty>
                <CommandGroup>
                  {availableUsers.map((user) => (
                    <CommandItem
                      key={user.id}
                      value={`${user.username} ${user.email || ""}`}
                      onSelect={() => handleAddUser(user.id)}
                      disabled={
                        addUserToWorkspaceMutation.isPending ||
                        addingUserId === user.id
                      }
                    >
                      <div className="flex items-center justify-between w-full">
                        <div className="flex flex-col">
                          <span className="font-medium">{user.username}</span>
                          {user.email && (
                            <span className="text-xs text-muted-foreground">
                              {user.email}
                            </span>
                          )}
                        </div>
                        {addingUserId === user.id && (
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
          {isLoadingWorkspaceUsers ? (
            <>
              <Skeleton className="h-9 w-full" />
              <Skeleton className="h-9 w-full" />
              <Skeleton className="h-9 w-full" />
            </>
          ) : workspaceUsers && workspaceUsers.length > 0 ? (
            workspaceUsers.map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between border rounded-md"
              >
                <span className="text-sm p-2 font-bold">{user.username}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveUser(user.id)}
                  disabled={removeUserFromWorkspaceMutation.isPending || removingUserId === user.id}
                  className="ml-2"
                >
                  {removingUserId === user.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <X size={16} />
                  )}
                </Button>
              </div>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Users className="h-12 w-12 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">
                No users found in this workspace group.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
