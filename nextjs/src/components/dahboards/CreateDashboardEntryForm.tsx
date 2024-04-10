import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { CreateDashboardEntrySchema } from "@/shared/schema/dashboard";
import { Input } from "@/components/ui/input";
import React from "react";
import { useForm } from "react-hook-form";
import { type z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import { HelpCircle, Loader } from "lucide-react";
import { type DashboardEntry } from "@/types/dashboardList";

type CreateDashboardEntryFormProps = {
  dashboardEntry?: DashboardEntry;
};

export function CreateDashboardEntryForm(props: CreateDashboardEntryFormProps) {
  const { dashboardEntry } = props;
  const form = useForm<z.infer<typeof CreateDashboardEntrySchema>>({
    resolver: zodResolver(CreateDashboardEntrySchema),
    defaultValues: {
      dashboardName: dashboardEntry?.name ?? "",
      description: dashboardEntry?.description ?? "",
      url: dashboardEntry?.url ?? "",
    },
  });

  function onSubmit(values: z.infer<typeof CreateDashboardEntrySchema>) {
    console.log("submitting");
    console.log(values);
  }

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    form.setValue("image", file);
  };

  const isLoading = false;

  return (
    <Form {...form}>
      <form
        onSubmit={(event) => void form.handleSubmit(onSubmit)(event)}
        className="flex flex-col gap-4"
      >
        <FormField
          control={form.control}
          name="dashboardName"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex gap-1">
                Dashboard Name
                <span title="This is the name configured for your gitops.">
                  <HelpCircle size={15} className="mr-2" />
                </span>
                :
              </FormLabel>
              <FormControl>
                <Input placeholder="Example Name" {...field} />
              </FormControl>

              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="url"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex gap-1">
                URL{" "}
                <span title="This is the name configured for your gitops.">
                  <HelpCircle size={15} className="mr-2" />
                </span>
                :
              </FormLabel>
              <FormControl>
                <Input placeholder="https://example.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="image"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex gap-1">
                Image{" "}
                <span title="This is the name configured for your gitops.">
                  <HelpCircle size={15} className="mr-2" />
                </span>
                :
              </FormLabel>
              <FormControl>
                <Input
                  type="file"
                  {...{ ...field, value: undefined }}
                  onChange={(e) => handleImageChange(e)}
                  className="text-xs text-stone-500 file:mr-5 file:rounded-md file:border-[0.5px]
                  file:bg-neutral-800 file:px-3 file:py-1 file:text-xs file:font-medium file:text-neutral-50 hover:file:cursor-pointer"
                />
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
              <FormLabel className="flex gap-1">
                Description{" "}
                <span title="This is the name configured for your gitops.">
                  <HelpCircle size={15} className="mr-2" />
                </span>
                :
              </FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Description of the dashboard."
                  className="resize-none"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={isLoading}>
          Save Entry
          {isLoading && (
            <span>
              <Loader size={20} className="ml-2 animate-spin" />
            </span>
          )}
        </Button>
      </form>
    </Form>
  );
}
