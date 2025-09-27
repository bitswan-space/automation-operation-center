"use client";

import { Button } from "@/components/ui/button";
import { Label } from "../ui/label";
import React from "react";
import { Switch } from "@/components/ui/switch";
import { canMutateSidebarItems } from "@/lib/permissions";
import { useAuth } from "@/context/AuthContext";
import { useSidebar } from "../ui/sidebar";
import { useSidebarItems } from "@/context/SideBarItemsProvider";
import { useAction } from "@/hooks/useAction";
import { toast } from "sonner";
import { createOrUpdateOrgGroupAction } from "../groups/action";

// TODO: fix nav items

export function SwitchForm() {
  const { editMode, setEditMode } = useSidebar();

  const { deserializedNavItems } = useSidebarItems();

  const { user: session } = useAuth();

  const { execute, isPending, result } = useAction(
    createOrUpdateOrgGroupAction,
    {
      onSuccess: ({ data }) => {
        toast.success((data as any)?.message ?? "Group updated successfully");
      },
      onError: ({ error }) => {
        console.error(error);
        toast.error((error as any)?.serverError?.message ?? "Error updating group");
      },
    },
  );

  const hasPerms = canMutateSidebarItems(session);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h3 className="mb-4 text-lg font-medium">General Settings</h3>
        <div className="space-y-4">
          <div className="flex flex-row items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label className="text-base">Toggle Navbar Edit Mode</Label>
              <div className="text-sm text-neutral-500">
                Enable or disable edit mode for the dashboard&apos;s navigation
                bar.
              </div>
            </div>

            <Switch
              checked={editMode}
              onCheckedChange={setEditMode}
              disabled={!hasPerms}
            />
          </div>
        </div>
      </div>
      <div className="text-end">
        <form action={execute}>
          <input
            name="id"
            type="hidden"
            defaultValue={""}
          />
          <input
            name="name"
            type="hidden"
            defaultValue={""}
          />
          <input
            name="nav_items"
            type="hidden"
            defaultValue={JSON.stringify(deserializedNavItems)}
          />
          <Button type="submit" disabled={!editMode || isPending || !hasPerms}>
            {isPending ? "Saving..." : "Save"}
          </Button>
        </form>
      </div>
    </div>
  );
}
