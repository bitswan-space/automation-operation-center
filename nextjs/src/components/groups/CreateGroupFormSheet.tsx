import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../ui/form";
import { Loader } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { HexColorPicker } from "react-colorful";
import { Input } from "@/components/ui/input";
import React from "react";
import { Textarea } from "../ui/textarea";
import { USER_GROUPS_QUERY_KEY } from "@/shared/constants";
import {
  createUserGroup,
  updateUserGroup,
  type UserGroup,
} from "./groupsHooks";
import { useForm } from "react-hook-form";
import { useSession } from "next-auth/react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

export const CreateGroupFormSchema = z.object({
  name: z.string().min(2, {
    message: "Group name must be at least 2 characters.",
  }),
  description: z.string().optional(),
  broker: z.string().optional(),
  tag_color: z.string().optional(),
});

type CreateGroupFormSheetProps = {
  trigger: React.ReactNode;
  group?: UserGroup;
};

export function CreateGroupFormSheet(props: CreateGroupFormSheetProps) {
  const { trigger, group } = props;

  return (
    <Sheet>
      <SheetTrigger asChild>{trigger}</SheetTrigger>
      <SheetContent className="min-w-full space-y-2 p-4 md:min-w-[500px]">
        <SheetHeader>
          <SheetTitle>Create Group</SheetTitle>
          <SheetDescription>
            Make changes to your group here. Click save when youre done.
          </SheetDescription>
        </SheetHeader>
        <CreateGroupForm group={group} />
      </SheetContent>
    </Sheet>
  );
}

type CreateGroupFormProps = {
  group?: UserGroup;
};
function CreateGroupForm(props: CreateGroupFormProps) {
  const { group } = props;
  const { data: session } = useSession();
  const queryClient = useQueryClient();

  const accessToken = session?.access_token;

  const form = useForm<z.infer<typeof CreateGroupFormSchema>>({
    resolver: zodResolver(CreateGroupFormSchema),
    defaultValues: {
      name: group?.name ?? "",
      description: group?.description ?? "",
      tag_color: group?.tag_color ?? "#aabbcc",
    },
  });

  const invalidateUserGroupsQuery = () => {
    queryClient
      .invalidateQueries({
        queryKey: [USER_GROUPS_QUERY_KEY],
      })
      .then(() => {
        console.log("Invalidated user-groups query");
      })
      .catch((error) => {
        console.error("Error invalidating user-groups query", error);
      });
  };

  const updateUserGroupMutation = useMutation({
    mutationFn: updateUserGroup,
    onSuccess: () => {
      console.log("User group updated");
      invalidateUserGroupsQuery();
    },
  });

  const createUserGroupMutation = useMutation({
    mutationFn: createUserGroup,
    onSuccess: () => {
      console.log("User group created");
      invalidateUserGroupsQuery();
    },
  });

  function onSubmit(values: z.infer<typeof CreateGroupFormSchema>) {
    console.log("submitting");

    if (group) {
      updateUserGroupMutation.mutate({
        accessToken: accessToken ?? "",
        id: group.id,
        userGroup: values,
      });
      return;
    }
    // Call the create MQTTBroker mutation
    createUserGroupMutation.mutate({
      accessToken: accessToken ?? "",
      userGroup: values,
    });
  }

  const isLoading =
    createUserGroupMutation.isPending || updateUserGroupMutation.isPending;
  return (
    <Form {...form}>
      <form onSubmit={(event) => void form.handleSubmit(onSubmit)(event)}>
        <div className="grid gap-4 py-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name:</FormLabel>
                <FormControl>
                  <Input placeholder="Group name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description:</FormLabel>
                <FormControl>
                  <Textarea placeholder="Group description" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="tag_color"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tag Color:</FormLabel>
                <FormControl>
                  <div>
                    <HexColorPicker
                      color={field.value}
                      onChange={field.onChange}
                      className="w-full"
                    />
                    <div
                      className={`mt-2 text-lg font-medium underline`}
                      style={{
                        color: field.value,
                      }}
                    >
                      {field.value}
                    </div>
                  </div>
                </FormControl>
                <FormMessage />
                <FormDescription>
                  You can use any color you want. This will be used to color the
                  group tags .
                </FormDescription>
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end">
          <Button type="submit" className="bg-blue-600" disabled={isLoading}>
            Save changes
            {isLoading && (
              <span>
                <Loader size={20} className="ml-2 animate-spin" />
              </span>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
