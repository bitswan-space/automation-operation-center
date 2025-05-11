import {
  type CreateGitopsActionState,
  createGitopsAction,
} from "@/server/actions/gitops";

import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Loader } from "lucide-react";
import React from "react";

type EditGitopsItemFormProps = {
  name: string;
  id: string;
  onSuccessfulEdit: () => void;
  onSave: () => void;
};

export function EditGitopsItemForm(props: Readonly<EditGitopsItemFormProps>) {
  const { id, name, onSuccessfulEdit, onSave } = props;

  const [state, formAction, isPending] = React.useActionState<
    CreateGitopsActionState,
    FormData
  >(createGitopsAction, {});

  // Code Smell: This needs to be refactored
  React.useEffect(() => {
    if (isPending) {
      onSave();
    }
  }, [isPending, onSave]);

  React.useEffect(() => {
    if (state.status === "success") {
      onSuccessfulEdit();
    }
  }, [state, onSuccessfulEdit]);

  return (
    <form action={formAction} className="my-auto flex w-full justify-end gap-4">
      <div className="w-2/3">
        <Input hidden name="id" defaultValue={id} />
        <Input
          className="w-full bg-white text-sm"
          name="name"
          defaultValue={name}
        />
        {state?.errors?.name && (
          <p className="mb-1 text-xs text-red-400">{state.errors.name[0]}</p>
        )}
      </div>

      <Button type="submit" disabled={isPending}>
        Save
        {isPending && (
          <span>
            <Loader size={20} className="ml-2 animate-spin" />
          </span>
        )}
      </Button>
    </form>
  );
}
