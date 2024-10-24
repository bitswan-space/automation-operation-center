"use client";

import { CheckCheck, Copy } from "lucide-react";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

import { Badge } from "../ui/badge";
import { Button } from "@/components/ui/button";
import { CreateGitopsSchema } from "@/shared/schema/gitops";
import { Input } from "@/components/ui/input";
import React from "react";
import useClipboard from "react-use-clipboard";
import { useForm } from "react-hook-form";
import { type z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createGitops } from "./hooks";
import { useSession } from "next-auth/react";
import { HelpCircle, Loader } from "lucide-react";

export function CreateGitopsForm() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();

  const accessToken = session?.access_token;

  const createGitopsMutation = useMutation({
    mutationFn: createGitops,
    onSuccess: () => {
      console.log("Gitops created");
      queryClient
        .invalidateQueries({
          queryKey: ["gitops"],
        })
        .then(() => {
          console.log("Invalidated gitops query");
        })
        .catch((error) => {
          console.error("Error invalidating gitops query", error);
        });
    },
  });

  const form = useForm<z.infer<typeof CreateGitopsSchema>>({
    resolver: zodResolver(CreateGitopsSchema),
    defaultValues: {
      gitopsName: "",
    },
  });

  function onSubmit(values: z.infer<typeof CreateGitopsSchema>) {
    console.log("submitting");
    console.log(values);

    createGitopsMutation.mutate({
      apiToken: accessToken ?? "",
      name: values.gitopsName,
    });
  }

  const isLoading = createGitopsMutation.isLoading;

  console.log("CreateGitopsForm", createGitopsMutation.data);
  return (
    <Form {...form}>
      <form
        onSubmit={(event) => void form.handleSubmit(onSubmit)(event)}
        className="space-y-8"
      >
        <FormField
          control={form.control}
          name="gitopsName"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex gap-1">
                Gitops Name{" "}
                <span title="This is the name configured for your gitops.">
                  <HelpCircle size={15} className="mr-2" />
                </span>
                :
              </FormLabel>
              <FormControl>
                <Input placeholder="Example Name" {...field} />
              </FormControl>

              <FormMessage />

              <div>
                {createGitopsMutation.data && (
                  <TokenDisplay token={createGitopsMutation.data.secret_key} />
                )}
              </div>
            </FormItem>
          )}
        />
        <Button type="submit" disabled={isLoading}>
          Add Gitops{" "}
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

type TokenDisplayProps = {
  token: string;
};
function TokenDisplay(props: Readonly<TokenDisplayProps>) {
  const { token } = props;

  const [isCopied, setCopied] = useClipboard(token, {});

  return (
    <div className="rounded-md bg-green-100/70 p-4">
      <div className="pb-2 text-xs text-green-950">
        Gitops successfuly setup. Copy gitops token below and store securely:
      </div>
      <div className="flex justify-between">
        <div className="rounded-md  bg-neutral-50 px-4 py-1 text-sm">
          {token}
        </div>
        <div className="flex gap-4">
          <div>
            {isCopied && <Badge className="bg-neutral-700">Copied!</Badge>}
          </div>
          {isCopied ? (
            <CheckCheck size={20} />
          ) : (
            <Copy size={20} onClick={setCopied} className="cursor-pointer" />
          )}
        </div>
      </div>
    </div>
  );
}
