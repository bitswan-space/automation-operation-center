"use client";

import * as React from "react";

import {
  type AddMemberToGroupFormActionState,
  type UserGroup,
  addMemberToGroupAction,
} from "@/server/actions/groups";
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
import { canMutateUsers } from "@/lib/permissions";
import { useSession } from "next-auth/react";
import { Button } from "../ui/button";

type GroupComboBoxSelectorProps = {
  groups?: UserGroup[];
  userId: string;
};

export function GroupComboBoxSelector(props: GroupComboBoxSelectorProps) {
  const { groups, userId } = props;

  const { data: session } = useSession();
  const hasPerms = canMutateUsers(session);

  const [open, setOpen] = React.useState(false);
  const [value, setValue] = React.useState("");

  const onAddMemberClick = (groupId?: string) => {
    setValue(groupId ?? "");
    setOpen(true);
  };

  const onSuccess = () => {
    setOpen(false);
    setValue("");
  };

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
                  onSelect={onAddMemberClick}
                  asChild
                >
                  <AddMemberButton
                    group={group}
                    userId={userId}
                    value={value}
                    onSuccess={onSuccess}
                    className="h-full w-full cursor-pointer justify-start text-left"
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
  userId: string;
  value: string;
  className?: string;
  onSuccess?: () => void;
};

const AddMemberButton = (props: AddMemberButtonProps) => {
  const { group, userId, value, className, onSuccess } = props;

  const [state, formAction, isPending] = React.useActionState<
    AddMemberToGroupFormActionState,
    FormData
  >(addMemberToGroupAction, {});

  React.useEffect(() => {
    if (state.status === "success") {
      onSuccess?.();
    }
  }, [isPending]);

  return (
    <form action={formAction}>
      <input type="hidden" name="userId" defaultValue={userId} />
      <input type="hidden" name="groupId" defaultValue={group.id} />
      <Button className={className} variant={"ghost"}>
        {isPending && value === group.id && (
          <Loader2 size={20} className="mr-2 h-4 w-4 animate-spin" />
        )}
        {group.name}
      </Button>
    </form>
  );
};
