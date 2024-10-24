"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { NavItem, getLastId } from "../utils/NavItems";

import { Button } from "@/components/ui/button";
import { Folder } from "lucide-react";
import { Input } from "@/components/ui/input";
import { NodeModel } from "@minoru/react-dnd-treeview";
import React from "react";
import { useForm } from "react-hook-form";
import { useSidebarItems } from "@/context/SideBarItemsProvider";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

type CreateFolderFormDialogProps = {
  parentId?: number;
  trigger?: React.ReactNode;
  navItem?: NodeModel<NavItem>;
};

export function CreateFolderFormDialog(props: CreateFolderFormDialogProps) {
  const { parentId, trigger, navItem } = props;
  const [open, setOpen] = React.useState(false);

  const handleSubmit = () => {
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ? (
          trigger
        ) : (
          <button className="flex w-full">
            <div>
              <Folder size={16} className="mr-2" />
            </div>
            <div>{navItem ? "Edit" : "New"} Folder</div>
          </button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{navItem ? "Edit" : "Create"} Folder</DialogTitle>
          <DialogDescription>
            Make changes to your folder here. Click save when done.
          </DialogDescription>
        </DialogHeader>
        <CreateFolderItemForm
          onSubmit={handleSubmit}
          parentId={parentId}
          navItem={navItem}
        />
      </DialogContent>
    </Dialog>
  );
}

const folderItemSchema = z.object({
  name: z.string().min(2).max(50),
});

type CreateFolderItemFormProps = {
  parentId?: number;
  navItem?: NodeModel<NavItem>;
  onSubmit?: () => void;
};

function CreateFolderItemForm(props: CreateFolderItemFormProps) {
  const { onSubmit, parentId, navItem } = props;

  console.log("navItem", navItem);

  const { sidebarItems, setSidebarItems } = useSidebarItems();

  const form = useForm<z.infer<typeof folderItemSchema>>({
    resolver: zodResolver(folderItemSchema),
    defaultValues: {
      name: navItem?.text ?? "",
    },
  });

  function handleSubmit(values: z.infer<typeof folderItemSchema>) {
    if (navItem) {
      // Edit existing folder
      const updatedItems = sidebarItems.map((item) => {
        if (item.id === navItem.id) {
          return {
            ...item,
            text: values.name,
          };
        }
        return item;
      });
      setSidebarItems(updatedItems);
    } else {
      // Create new folder
      const lastId = ((getLastId(sidebarItems) as number) ?? 0) + 1;
      setSidebarItems([
        ...sidebarItems,
        {
          text: values.name,
          parent: parentId ?? 0,
          droppable: true,
          id: lastId,
          data: {
            type: "folder",
          },
        },
      ]);
    }

    onSubmit?.();
  }

  return (
    <Form {...form}>
      <form
        onSubmit={(event) => void form.handleSubmit(handleSubmit)(event)}
        className="space-y-4"
      >
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input
                  placeholder="Example Name"
                  className="w-full"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end">
          <Button type="submit">{navItem ? "Update" : "Save"}</Button>
        </div>
      </form>
    </Form>
  );
}
