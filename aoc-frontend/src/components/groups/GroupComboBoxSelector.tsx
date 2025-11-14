import * as React from "react";

import { type UserGroup } from "@/data/groups";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Loader2, Plus } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import { Badge } from "../ui/badge";
import { useAdminStatus } from "@/hooks/useAdminStatus";
import { Button } from "../ui/button";
import { useAction } from "@/hooks/useAction";
import {
  type AddWorkspaceToGroupActionType,
  type AddUserToGroupActionType,
  type AddAutomationServerToGroupActionType,
} from "./action";
import { toast } from "sonner";
import { useCallback, useRef, useState, useEffect } from "react";

type GroupComboBoxSelectorProps = {
  groups?: UserGroup[];
  id: string;
  action:
    | AddUserToGroupActionType
    | AddWorkspaceToGroupActionType
    | AddAutomationServerToGroupActionType;
  onUserGroupUpdate?: (userId: string, groupId: string, action: 'add' | 'remove') => void;
  handleNextPage: () => Promise<boolean>;
  hasMoreGroups?: boolean;
};

export function GroupComboBoxSelector(props: GroupComboBoxSelectorProps) {
  const { groups, id, action, onUserGroupUpdate, handleNextPage, hasMoreGroups } = props;
  const { isAdmin: hasPerms } = useAdminStatus();
  const [open, setOpen] = React.useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const [hasNextPage, setHasNextPage] = useState(hasMoreGroups ?? false);
  const [isFetchingNextPage, setIsFetchingNextPage] = useState(false);

  // Update hasNextPage when hasMoreGroups prop changes
  useEffect(() => {
    if (hasMoreGroups !== undefined) {
      setHasNextPage(hasMoreGroups);
    }
  }, [hasMoreGroups]);

  // Load more groups function
  const loadMore = useCallback(async () => {
    if (!hasNextPage || isFetchingNextPage) return;
    
    setIsFetchingNextPage(true);
    try {
      const hasNext = await handleNextPage();
      setHasNextPage(hasNext);
    } finally {
      setIsFetchingNextPage(false);
    }
  }, [handleNextPage, hasNextPage, isFetchingNextPage]);

  // Intersection Observer for automatic loading when scrolling
  useEffect(() => {
    if (!hasNextPage || isFetchingNextPage) return;

    let observer: IntersectionObserver | null = null;

    // Small delay to ensure DOM is ready
    const timeoutId = setTimeout(() => {
      if (!sentinelRef.current) return;

      const sentinel = sentinelRef.current;
      const scrollContainer = listRef.current;

      const observerCallback = (entries: IntersectionObserverEntry[]) => {
        const [entry] = entries;
        if (entry.isIntersecting) {
          loadMore();
        }
      };

      observer = new IntersectionObserver(observerCallback, {
        root: scrollContainer,
        rootMargin: '0px',
        threshold: 0.1,
      });

      observer.observe(sentinel);
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      if (observer) {
        observer.disconnect();
      }
    };
  }, [open, hasNextPage, isFetchingNextPage, loadMore, groups]);

  // Prevent popover from closing while fetching more groups
  // const handleOpenChange = useCallback((newOpen: boolean) => {
  //   // Don't allow closing while fetching
  //   if (!newOpen && isFetchingNextPage) {
  //     return;
  //   }
  //   setOpen(newOpen);
  // }, [isFetchingNextPage]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild disabled={!hasPerms}>
        <button>
          <Badge
            variant={"outline"}
            className="border-dashed border-neutral-900 bg-neutral-100"
          >
            Add <Plus className="ml-2 h-4 w-4" />
          </Badge>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0">
        <Command 
          key={`command-${id}`} 
          shouldFilter={false}
        >
          <CommandInput placeholder="Search groups..." />
          <CommandList ref={listRef}>
            <CommandEmpty>No group found.</CommandEmpty>
            <CommandGroup>
              {groups?.map((group) => (
                <CommandItem
                  key={group.id}
                  value={group.id}
                  asChild
                >
                  <AddMemberButton
                    group={group}
                    id={id}
                    onSuccess={() => setOpen(false)}
                    className="h-full w-full cursor-pointer justify-start text-left"
                    action={action}
                    onUserGroupUpdate={onUserGroupUpdate}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
            {/* Sentinel element for Intersection Observer - automatically triggers loading when visible */}
            {hasNextPage && (
              <div ref={sentinelRef} className="h-1" />
            )}
            {isFetchingNextPage && (
              <div className="flex items-center justify-center py-2">
                <Loader2 className="size-4 animate-spin text-muted-foreground" />
              </div>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

type AddMemberButtonProps = {
  group: UserGroup;
  id: string;
  className?: string;
  onSuccess?: () => void;
  action:
    | AddUserToGroupActionType
    | AddWorkspaceToGroupActionType
    | AddAutomationServerToGroupActionType;
  onUserGroupUpdate?: (userId: string, groupId: string, action: 'add' | 'remove') => void;
};

const AddMemberButton = (props: AddMemberButtonProps) => {
  const { group, id, className, onSuccess, action, onUserGroupUpdate } = props;

  const { execute, isPending } = useAction(action, {
    onSuccess: () => {
      onSuccess?.();
      toast.success("User added to group");
      if (onUserGroupUpdate) {
        onUserGroupUpdate(id, group.id, 'add');
      }
    },
    onError: ({ error }) => {
      toast.error((error as any)?.serverError?.message ?? "Error adding user to group");
    },
  });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      id: formData.get("id") as string,
      groupId: formData.get("groupId") as string,
    };
    await execute(data);
  };

  return (
    <form onSubmit={handleSubmit}>
      <input type="hidden" name="id" defaultValue={id} />
      <input type="hidden" name="groupId" defaultValue={group.id} />
      <Button className={className} variant={"ghost"} type="submit" disabled={isPending}>
        {isPending && (
          <Loader2 size={20} className="mr-2 h-4 w-4 animate-spin" />
        )}
        {group.name}
      </Button>
    </form>
  );
};
