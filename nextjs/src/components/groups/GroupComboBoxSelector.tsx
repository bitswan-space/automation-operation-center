"use client";

import * as React from "react";

import { Loader2, Plus } from "lucide-react";
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

import { Badge } from "../ui/badge";
import { addMemberToGroup, type UserGroup } from "./groupsHooks";
import { useSession } from "next-auth/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ORG_USERS_QUERY_KEY } from "@/shared/constants";

type GroupComboBoxSelectorProps = {
  groups?: UserGroup[];
  userId: string;
};

export function GroupComboBoxSelector(props: GroupComboBoxSelectorProps) {
  const { groups, userId } = props;

  const { data: session } = useSession();
  const queryClient = useQueryClient();

  const accessToken = session?.access_token;

  const [open, setOpen] = React.useState(false);
  const [value, setValue] = React.useState("");

  const addMemberToGroupMutation = useMutation({
    mutationFn: addMemberToGroup,
    onSuccess: () => {
      console.log("User group updated");
      queryClient
        .invalidateQueries({
          queryKey: [ORG_USERS_QUERY_KEY],
        })
        .then(() => {
          console.log("Invalidated org-users query");
        })
        .catch((error) => {
          console.error("Error invalidating org-users query", error);
        });

      setValue("");
      setOpen(false);
    },
  });

  const handleAddMemberClick = (groupId?: string) => {
    setValue(groupId ?? "");
    addMemberToGroupMutation.mutate({
      accessToken: accessToken ?? "",
      userId: userId,
      groupId: groupId ?? "",
    });
  };

  const isLoading = addMemberToGroupMutation.isLoading;

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
      <PopoverContent className="w-[200px] p-0">
        <Command>
          <CommandInput placeholder="Search groups..." />
          <CommandList>
            <CommandEmpty>No group found.</CommandEmpty>
            <CommandGroup>
              {groups?.map((group) => (
                <CommandItem
                  key={group.id}
                  value={group.id}
                  onSelect={(currentValue) => {
                    handleAddMemberClick(currentValue);
                  }}
                >
                  {isLoading && value === group.id && (
                    <Loader2 size={20} className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {group.name}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
