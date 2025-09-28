import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

import { CreateOrEditGroupForm } from "./CreateOrEditGroupForm";
import React from "react";
import { type UserGroup } from "@/data/groups";

type CreateGroupFormSheetProps = {
  trigger: React.ReactNode;
  group?: UserGroup;
  onGroupCreated?: () => void;
};

export function CreateGroupFormSheet(props: CreateGroupFormSheetProps) {
  const { trigger, group, onGroupCreated } = props;
  const [open, setOpen] = React.useState(false);

  const handleSuccess = () => {
    setOpen(false);
    onGroupCreated?.();
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>{trigger}</SheetTrigger>
      <SheetContent className="min-w-full space-y-2 p-4 md:min-w-[500px]">
        <SheetHeader>
          <SheetTitle>Create Group</SheetTitle>
          <SheetDescription>
            Make changes to your group here. Click save when youre done.
          </SheetDescription>
        </SheetHeader>
        <CreateOrEditGroupForm group={group} onSuccess={handleSuccess} />
      </SheetContent>
    </Sheet>
  );
}
