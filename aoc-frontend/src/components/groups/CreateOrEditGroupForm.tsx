"use client";

import * as React from "react";

import { type UserGroup } from "@/data/groups";

import { Button } from "../ui/button";
import { HexColorPicker } from "react-colorful";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Loader } from "lucide-react";
import { Textarea } from "../ui/textarea";
import { toast } from "sonner";
import { useCreateGroup, useUpdateGroup } from "@/hooks/useGroupQuery";

type CreateGroupFormProps = {
  group?: UserGroup;
  onSuccess?: () => void;
};

export function CreateOrEditGroupForm(props: CreateGroupFormProps) {
  const { group, onSuccess } = props;

  const tagColorInputRef = React.useRef<HTMLInputElement>(null);

  const createGroupMutation = useCreateGroup();
  const updateGroupMutation = useUpdateGroup();

  const isPending = createGroupMutation.isPending || updateGroupMutation.isPending;

  const [tagColor, setTagColor] = React.useState<string>(
    group?.tag_color ?? "#2f3b46",
  );

  const handleColorChange = (color: string) => {
    setTagColor(color);
    if (tagColorInputRef.current) {
      tagColorInputRef.current.value = color;
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get("name") as string,
      description: formData.get("description") as string,
      tag_color: formData.get("tag_color") as string,
    };
    
    if (group?.id) {
      // Update existing group
      updateGroupMutation.mutate(
        { ...data, id: group.id },
        {
          onSuccess: (result) => {
            toast.success((result as any)?.message ?? "Group updated successfully");
            onSuccess?.();
          },
          onError: (error) => {
            toast.error((error as any)?.message ?? "Error updating group");
          },
        }
      );
    } else {
      // Create new group
      createGroupMutation.mutate(data, {
        onSuccess: (result) => {
          toast.success((result as any)?.message ?? "Group created successfully");
          onSuccess?.();
        },
        onError: (error) => {
          toast.error((error as any)?.message ?? "Error creating group");
        },
      });
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid gap-4 py-4">
        <div>
          <Label>Name:</Label>
          <Input
            placeholder="Group name"
            required
            minLength={2}
            name="name"
            defaultValue={group?.name ?? ""}
            disabled={group?.name === "admin"}
            className=""
          />
        </div>

        <div>
          <Label>Description:</Label>
          <Textarea
            placeholder="Group description"
            name="description"
            defaultValue={group?.description ?? ""}
            className=""
          />
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
