import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "../ui/form";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import React from "react";
import { UpdateGitopsSchema } from "@/shared/schema/gitops";
import { updateGitops } from "./hooks";
import { useForm } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { type z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader } from "lucide-react";

type EditGitopsItemFormProps = {
  name: string;
  id: string;
  onSuccessfulEdit: () => void;
  onSave: () => void;
};

export function EditGitopsItemForm(props: Readonly<EditGitopsItemFormProps>) {
  const { id, name, onSuccessfulEdit, onSave } = props;

  const { data: session } = useSession();

  const accessToken = session?.access_token ?? "";

  const updateGitopsMutation = useMutation({
    mutationFn: updateGitops,
    onMutate: () => {
      onSave();
    },
    onSuccess: () => {
      console.log("Gitops updated");
      onSuccessfulEdit();
    },
  });

  const form = useForm<z.infer<typeof UpdateGitopsSchema>>({
    resolver: zodResolver(UpdateGitopsSchema),
    defaultValues: {
      gitopsName: name,
    },
  });

  function onSubmit(values: z.infer<typeof UpdateGitopsSchema>) {
    console.log(values);

    updateGitopsMutation.mutate({
      apiToken: accessToken,
      name: values.gitopsName,
      id: id,
    });
  }

  const isLoading = updateGitopsMutation.isLoading;

  return (
    <Form {...form}>
      <form
        onSubmit={(event) => void form.handleSubmit(onSubmit)(event)}
        className="my-auto flex w-full justify-end gap-4"
      >
        <FormField
          control={form.control}
          name="gitopsName"
          render={({ field }) => (
            <FormItem className="w-2/3">
              <FormControl>
                <Input {...field} className="w-full bg-white text-sm" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={isLoading}>
          Save
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
