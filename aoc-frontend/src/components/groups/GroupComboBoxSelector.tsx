"use client";

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
import { useAuth } from "@/context/AuthContext";
import { Button } from "../ui/button";
import { useAction } from "@/hooks/useAction";
import {
  type AddWorkspaceToGroupActionType,
  type AddUserToGroupActionType,
  type AddAutomationServerToGroupActionType,
} from "./action";
import { toast } from "sonner";

type GroupComboBoxSelectorProps = {
  groups?: UserGroup[];
  id: string;
  action:
    | AddUserToGroupActionType
    | AddWorkspaceToGroupActionType
    | AddAutomationServerToGroupActionType;
  onUserGroupUpdate?: (userId: string, groupId: string, action: 'add' | 'remove') => void;
};

export function GroupComboBoxSelector(props: GroupComboBoxSelectorProps) {
  const { groups, id, action, onUserGroupUpdate } = props;

  const { user: session } = useAuth();
  const { isAdmin: hasPerms } = useAdminStatus();

  const [open, setOpen] = React.useState(false);

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
        <Command>
          <CommandInput placeholder="Search groups..." />
          <CommandList>
            <CommandEmpty>No group found.</CommandEmpty>
            <CommandGroup>
              {groups?.map((group) => (
                <CommandItem
                  key={group.id}
                  value={group.id}
                  onSelect={() => setOpen(true)}
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
