import {
  type DeleteGitopsActionState,
  deleteGitopsAction,
} from "@/server/actions/gitops";
import { Loader, PenLine, Server, Trash2, X } from "lucide-react";

import { Button } from "../ui/button";
import { EditGitopsItemForm } from "./EditGitopsItemForm";
import React from "react";
import { Separator } from "@/components/ui/separator";

type GitopsListItemProps = {
  id: string;
  name: string;
};
export function GitopsListItem(props: Readonly<GitopsListItemProps>) {
  const { id, name } = props;

  const [isSaving, setIsSaving] = React.useState(false);

  const [showEditForm, setShowEditForm] = React.useState(false);

  const [state, formAction, deleteActionPending] = React.useActionState<
    DeleteGitopsActionState,
    FormData
  >(deleteGitopsAction, {});

  const handleEditClick = () => {
    setShowEditForm((prev) => !prev);
  };

  const handleSuccessfulEdit = () => {
    setShowEditForm(false);
    setIsSaving(false);
  };

  const isLoading = deleteActionPending || isSaving;

  console.log("isLoading", isLoading);

  return (
    <li className="flex justify-between gap-4 rounded-md bg-neutral-100/80 p-2 px-4 shadow-sm">
      <div className="my-auto flex w-full gap-6">
        <div className="flex w-1/2 gap-2">
          {deleteActionPending && (
            <span className="my-auto">
              <Loader size={20} className="mr-2 animate-spin" />
            </span>
          )}
          <div className="my-auto rounded-md p-2 text-neutral-800">
            <Server size={20} />
          </div>
          <div>
            <div className="text-sm font-semibold">Name:</div>
            <div className="font-mono text-xs">{name}</div>
          </div>
        </div>

        {showEditForm && (
          <EditGitopsItemForm
            name={name}
            id={id}
            onSuccessfulEdit={handleSuccessfulEdit}
            onSave={() => setIsSaving(true)}
          />
        )}
      </div>
      <div className="my-auto flex h-6">
        <EditGitopsItemButton
          isLoading={isLoading}
          onClick={handleEditClick}
          isEditing={showEditForm}
        />
        <Separator
          orientation="vertical"
          className="cursor-pointer bg-neutral-400"
        />
        <form action={formAction}>
          <input hidden name="id" defaultValue={id} />
          <Button type="submit" variant={"ghost"} disabled={isLoading}>
            <Trash2 size={20} className="cursor-pointer" />
          </Button>
        </form>
      </div>
    </li>
  );
}

type EditGitopsItemButtonProps = {
  isEditing: boolean;
  onClick: () => void;
  isLoading: boolean;
};

function EditGitopsItemButton(props: EditGitopsItemButtonProps) {
  const { onClick, isEditing, isLoading } = props;
  return (
    <Button onClick={onClick} variant={"ghost"} disabled={isLoading}>
      {isEditing ? <X size={20} /> : <PenLine size={20} />}
    </Button>
  );
}
