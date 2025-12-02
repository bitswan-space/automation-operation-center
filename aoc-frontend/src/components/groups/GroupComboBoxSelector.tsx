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
import { Button } from "../ui/button";
import { toast } from "sonner";
import { useCallback, useMemo, useState, useEffect } from "react";
import { useAddUserToGroup } from "@/hooks/useGroupQuery";
import { useUserNonMemberGroupsQuery } from "@/hooks/useUsersQuery";

type GroupComboBoxSelectorProps = {
  userId: string;
};

export function GroupComboBoxSelector(props: GroupComboBoxSelectorProps) {
  const { userId } = props;
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Debounce search input to avoid too many requests while typing
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [search]);

  // Reset search when popover closes
  useEffect(() => {
    if (!open) {
      setSearch("");
      setDebouncedSearch("");
    }
  }, [open]);

  // Fetch non-member groups for this user with server-side search
  // The query key includes debouncedSearch, so changing it will automatically trigger a new query
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isFetching } = useUserNonMemberGroupsQuery(userId, debouncedSearch);

  // Flatten all pages into a single array
  const groups = useMemo(
    () => data?.pages.flatMap((page) => page.results) ?? [],
    [data],
  );

  // Handle scroll to load more groups when near bottom
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    const scrollTop = target.scrollTop;
    const scrollHeight = target.scrollHeight;
    const clientHeight = target.clientHeight;
    
    // Load more when scrolled within 50px of the bottom
    const scrollBottom = scrollHeight - scrollTop - clientHeight;
    if (scrollBottom < 50 && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button>
          <Badge
            variant={"outline"}
            className="border-dashed border-neutral-900 bg-neutral-100"
          >
            Add <Plus className="ml-2 h-4 w-4" />
          </Badge>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] max-h-80 p-0">
        <Command 
          key={`command-${userId}`} 
          shouldFilter={false}
        >
          <CommandInput 
            placeholder="Search groups..." 
            value={search}
            onValueChange={setSearch}
          />
          <CommandList onScroll={handleScroll}>
            {!isFetching && groups.length === 0 && <CommandEmpty>No group found.</CommandEmpty>}
            <CommandGroup>
              {groups.map((group) => (
                <CommandItem
                  key={group.id}
                  value={group.id}
                  asChild
                >
                  <AddMemberButton
                    group={group}
                    id={userId}
                    onSuccess={() => setOpen(false)}
                    className="h-full w-full cursor-pointer justify-start text-left"
                  />
                </CommandItem>
              ))}
            </CommandGroup>
            {(isFetching && !data) && (
              <div className="flex items-center justify-center py-2">
                <Loader2 className="size-4 animate-spin text-muted-foreground" />
              </div>
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
};

const AddMemberButton = (props: AddMemberButtonProps) => {
  const { group, id, className, onSuccess } = props;

  const addUserToGroupMutation = useAddUserToGroup(id);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const groupId = formData.get("groupId") as string;
    
    addUserToGroupMutation.mutate(groupId, {
      onSuccess: () => {
        onSuccess?.();
        toast.success("User added to group");
      },
      onError: (error) => {
        toast.error((error as any)?.message ?? "Error adding user to group");
      },
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <input type="hidden" name="id" defaultValue={id} />
      <input type="hidden" name="groupId" defaultValue={group.id} />
      <Button className={className} variant={"ghost"} type="submit" disabled={addUserToGroupMutation.isPending}>
        {addUserToGroupMutation.isPending && (
          <Loader2 size={20} className="mr-2 h-4 w-4 animate-spin" />
        )}
        {group.name}
      </Button>
    </form>
  );
};
