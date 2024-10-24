"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../../../ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { NavItem, getLastId } from "../utils/NavItems";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../ui/select";

import { Button } from "../../../ui/button";
import { DynamicIcon } from "../DynamicIcon";
import { IconSelector } from "./IconSelector";
import { Input } from "../../../ui/input";
import { LayoutList } from "lucide-react";
import { NodeModel } from "@minoru/react-dnd-treeview";
import React from "react";
import { useForm } from "react-hook-form";
import { useSidebarItems } from "@/context/SideBarItemsProvider";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

type CreateNavItemFormDialogProps = {
  parentId?: number;
  trigger?: React.ReactNode;
  navItem?: NodeModel<NavItem>;
};

export function CreateNavItemFormDialog(props: CreateNavItemFormDialogProps) {
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
          <button className="flex">
            <div>
              <LayoutList size={16} className="mr-2" />
            </div>
            <div>New Item</div>
          </button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{navItem ? "Edit" : "Create"} Item</DialogTitle>
          <DialogDescription>
            Make changes to your item here. Click save when done.
          </DialogDescription>
        </DialogHeader>
        <CreateNavItemForm
          onSubmit={handleSubmit}
          parentId={parentId}
          navItem={navItem}
        />
      </DialogContent>
    </Dialog>
  );
}

const navItemSchema = z.object({
  name: z.string().min(2).max(50),
  link: z.string().url(),
  type: z.string(),
  icon: z.string(),
});

type CreateNavItemFormProps = {
  onSubmit?: () => void;
  parentId?: number;
  navItem?: NodeModel<NavItem>;
};

function CreateNavItemForm(props: CreateNavItemFormProps) {
  const { onSubmit, parentId, navItem } = props;

  const { sidebarItems, setSidebarItems } = useSidebarItems();

  const form = useForm<z.infer<typeof navItemSchema>>({
    resolver: zodResolver(navItemSchema),
    defaultValues: {
      name: navItem?.text ?? "",
      link: navItem?.data?.href ?? "",
      type: navItem?.data?.type ?? "external-link",
      icon: navItem?.data?.iconName,
    },
  });

  function handleSubmit(values: z.infer<typeof navItemSchema>) {
    if (navItem) {
      // Edit existing item
      const updatedItems = sidebarItems.map((item) => {
        if (item.id === navItem.id) {
          return {
            ...item,
            text: values.name,
            data: {
              ...item.data,
              type: values.type,
              href: values.link,
              iconName: values.icon,
              icon: (
                <DynamicIcon
                  name={values.icon}
                  size={24}
                  className="text-neutral-500"
                  title={values.icon}
                />
              ),
            },
          };
        }
        return item;
      });
      setSidebarItems(updatedItems);
    } else {
      // Add new item
      const lastId = ((getLastId(sidebarItems) as number) ?? 0) + 1;
      setSidebarItems([
        ...sidebarItems,
        {
          text: values.name,
          parent: parentId ?? 0,
          droppable: false,
          id: lastId,
          data: {
            type: values.type,
            href: values.link,
            iconName: values.icon,
            icon: (
              <DynamicIcon
                name={values.icon}
                size={24}
                className="text-neutral-500"
                title={values.icon}
              />
            ),
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
              <FormLabel>Name:</FormLabel>
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
        <FormField
          control={form.control}
          name="link"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Link:</FormLabel>
              <FormControl>
                <Input
                  placeholder="https://example.com"
                  className="w-full"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Type:</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger className="w-full" id="itemtype">
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="external-link">external-link</SelectItem>
                  <SelectItem value="topic-link">topic-link</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="icon"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Icon:</FormLabel>
              <FormControl>
                <IconSelector
                  onSelectIcon={field.onChange}
                  defaultValue={field.value}
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
