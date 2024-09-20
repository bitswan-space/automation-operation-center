import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../ui/form";
import { Loader2, Workflow } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

import { Button } from "@/components/ui/button";
import { HexColorPicker } from "react-colorful";
import { Input } from "@/components/ui/input";
import React from "react";
import { Skeleton } from "../ui/skeleton";
import { Textarea } from "../ui/textarea";
import { useForm } from "react-hook-form";
import { useMQTTBrokers } from "../mqtt-brokers/hooks/useMQTTBrokers";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

export const CreateGroupFormSchema = z.object({
  name: z.string().min(2, {
    message: "Group name must be at least 2 characters.",
  }),
  description: z.string().optional(),
  broker: z.string().optional(),
  color: z.string().optional(),
});

export function CreateGroupFormSheet() {
  const { data: mqttBrokers, isLoading } = useMQTTBrokers();

  const form = useForm<z.infer<typeof CreateGroupFormSchema>>({
    resolver: zodResolver(CreateGroupFormSchema),
    defaultValues: {
      name: "",
      description: "",
      color: "#aabbcc",
    },
  });

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button className="bg-blue-600 hover:bg-blue-700/80">
          Create Group
        </Button>
      </SheetTrigger>
      <SheetContent className="min-w-full space-y-2 p-4 md:min-w-[500px]">
        <SheetHeader>
          <SheetTitle>Create Group</SheetTitle>
          <SheetDescription>
            Make changes to your group here. Click save when youre done.
          </SheetDescription>
        </SheetHeader>
        <Form {...form}>
          <form action="">
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
                name="broker"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Broker:</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full bg-neutral-100">
                          <div className="flex items-center gap-2">
                            {isLoading ? (
                              <Loader2
                                size={20}
                                className="mr-2 animate-spin"
                              />
                            ) : (
                              <Workflow
                                size={20}
                                strokeWidth={2.0}
                                className="mr-2 text-neutral-600"
                              />
                            )}
                            <SelectValue
                              placeholder="Select mqtt broker"
                              className="font-medium"
                            />
                          </div>
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectGroup>
                          <SelectLabel>
                            <div>Active mqtt brokers</div>
                            {isLoading && (
                              <Skeleton className="mt-2 h-10 w-full" />
                            )}
                            {mqttBrokers?.results?.length === 0 && (
                              <div className="mt-2 flex h-16 flex-col items-center justify-center gap-2 rounded border border-dashed">
                                <div className="text-center text-sm font-normal text-neutral-500">
                                  No mqtt brokers found
                                </div>
                              </div>
                            )}
                          </SelectLabel>
                          {mqttBrokers?.results?.map((broker) => (
                            <SelectItem key={broker.id} value={broker.id}>
                              {broker.name}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>

                    <FormMessage />
                    <FormDescription>
                      Select the mqtt broker you want to use for this group.
                    </FormDescription>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="color"
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
                        <div className="mt-2 text-lg font-medium text-neutral-500 underline">
                          {field.value}
                        </div>
                      </div>
                    </FormControl>
                    <FormMessage />
                    <FormDescription>
                      You can use any color you want. This will be used to color
                      the group tags .
                    </FormDescription>
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end">
              <Button type="submit" className="bg-blue-600">
                Save changes
              </Button>
            </div>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
