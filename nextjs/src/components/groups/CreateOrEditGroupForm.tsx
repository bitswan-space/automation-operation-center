"use client";

import * as React from "react";

import { type UserGroup } from "@/server/actions/groups";

import { Button } from "../ui/button";
import { HexColorPicker } from "react-colorful";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Loader } from "lucide-react";
import { Textarea } from "../ui/textarea";
import { toast } from "sonner";
import { useAction } from "next-safe-action/hooks";
import { createOrUpdateOrgGroupAction } from "./action";

type CreateGroupFormProps = {
  group?: UserGroup;
};

export function CreateOrEditGroupForm(props: CreateGroupFormProps) {
  const { group } = props;

  const tagColorInputRef = React.useRef<HTMLInputElement>(null);

  const { execute, isPending, result } = useAction(
    createOrUpdateOrgGroupAction,
    {
      onSuccess: ({ data }) => {
        toast.success(data?.message ?? "Group updated successfully");
      },
      onError: ({ error }) => {
        toast.error(error.serverError?.message ?? "Error updating group");
      },
    },
  );

  const [tagColor, setTagColor] = React.useState<string>(
    group?.tag_color ?? "#2f3b46",
  );

  const handleColorChange = (color: string) => {
    setTagColor(color);
    if (tagColorInputRef.current) {
      tagColorInputRef.current.value = color;
    }
  };

  return (
    <form action={execute}>
      <input type="text" name="id" hidden defaultValue={group?.id ?? ""} />
      <div className="grid gap-4 py-4">
        <div>
          <Label>Name:</Label>
          <Input
            placeholder="Group name"
            required
            minLength={2}
            name="name"
            defaultValue={group?.name ?? result.data?.data.name ?? ""}
            className={result.validationErrors?.name ? "text-red-500" : ""}
          />
          {result.validationErrors?.name && (
            <div className="text-sm text-red-500">
              {result.validationErrors.name._errors?.[0]}
            </div>
          )}
        </div>

        <div>
          <Label>Description:</Label>
          <Textarea
            placeholder="Group description"
            name="description"
            defaultValue={
              group?.description ?? result.data?.data.description ?? ""
            }
            className={
              result.validationErrors?.description ? "text-red-500" : ""
            }
          />
          {result.validationErrors?.description && (
            <div className="text-sm text-red-500">
              {result.validationErrors.description._errors?.[0]}
            </div>
          )}
        </div>

        <input
          type="text"
          name="tag_color"
          defaultValue={tagColor}
          hidden
          ref={tagColorInputRef}
        />

        <div>
          <Label>Tag Color:</Label>
          <div>
            <HexColorPicker
              color={tagColor}
              onChange={handleColorChange}
              className="w-full"
            />
            <div
              className={`mt-2 text-lg font-medium underline`}
              style={{
                color: tagColor,
              }}
            >
              {tagColor}
            </div>
          </div>
          {result.validationErrors?.tag_color && (
            <div className="text-sm text-red-500">
              {result.validationErrors.tag_color._errors?.[0]}
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-end">
        <Button type="submit" className="bg-blue-600" disabled={isPending}>
          Save changes
          {isPending && (
            <span>
              <Loader size={20} className="ml-2 animate-spin" />
            </span>
          )}
        </Button>
      </div>
    </form>
  );
}
