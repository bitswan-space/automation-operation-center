"use client";

import * as React from "react";

import {
  CreateOrUpdateOrgGroupFormActionState,
  UserGroup,
  createOrUpdateOrgGroupAction,
} from "@/server/actions/groups";

import { Button } from "../ui/button";
import { HexColorPicker } from "react-colorful";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Loader } from "lucide-react";
import { Textarea } from "../ui/textarea";

type CreateGroupFormProps = {
  group?: UserGroup;
};

export function CreateOrEditGroupForm(props: CreateGroupFormProps) {
  const { group } = props;

  const tagColorInputRef = React.useRef<HTMLInputElement>(null);

  const [state, formAction, isPending] = React.useActionState<
    CreateOrUpdateOrgGroupFormActionState,
    FormData
  >(createOrUpdateOrgGroupAction, {});

  const [tagColor, setTagColor] = React.useState<string>(
    group?.tag_color ?? "aabbcc",
  );

  const handleColorChange = (color: string) => {
    setTagColor(color);
    if (tagColorInputRef.current) {
      tagColorInputRef.current.value = color;
    }
  };

  console.log("tagColor", tagColor);

  return (
    <form action={formAction}>
      <input type="text" name="id" hidden defaultValue={group?.id ?? ""} />
      <div className="grid gap-4 py-4">
        <div>
          <Label>Name:</Label>
          <Input
            placeholder="Group name"
            required
            minLength={2}
            name="name"
            defaultValue={group?.name ?? state.data?.name ?? ""}
            className={state.errors?.name ? "text-red-500" : ""}
          />
          {state.errors?.name && (
            <div className="text-red-500">{state.errors.name[0]}</div>
          )}
        </div>

        <div>
          <Label>Description:</Label>
          <Textarea
            placeholder="Group description"
            name="description"
            defaultValue={group?.description ?? state.data?.description ?? ""}
            className={state.errors?.description ? "text-red-500" : ""}
          />
          {state.errors?.description && (
            <div className="text-red-500">{state.errors.description[0]}</div>
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
          {state.errors?.tag_color && (
            <div className="text-red-500">{state.errors.tag_color[0]}</div>
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
