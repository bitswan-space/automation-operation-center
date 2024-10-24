"use client";

import {
  ACTIVE_MQTT_PROFILE_STORAGE_KEY,
  MQTT_PROFILE_QUERY_KEY,
  ORG_USERS_QUERY_KEY,
} from "@/shared/constants";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { Label } from "../ui/label";
import { updateUserGroup, type MQTTProfile } from "../groups/groupsHooks";
import React from "react";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import useLocalStorageState from "ahooks/lib/useLocalStorageState";
import { useSession } from "next-auth/react";
import { useSidebar } from "../ui/sidebar";
import { useSidebarItems } from "@/context/SideBarItemsProvider";
import { type AxiosError } from "axios";

export function SwitchForm() {
  const { editMode, setEditMode } = useSidebar();

  const { deserializedNavItems } = useSidebarItems();

  const { data: session } = useSession();
  const queryClient = useQueryClient();

  const accessToken = session?.access_token;

  const [activeMQTTProfile] = useLocalStorageState<MQTTProfile | undefined>(
    ACTIVE_MQTT_PROFILE_STORAGE_KEY,
    {
      listenStorageChange: true,
    },
  );

  const saveOrgGroupSidebarMutation = useMutation({
    mutationFn: updateUserGroup,
    onSuccess: async () => {
      console.log("User group updated");

      try {
        await queryClient.invalidateQueries({
          queryKey: [ORG_USERS_QUERY_KEY],
        });

        await queryClient.invalidateQueries({
          queryKey: [MQTT_PROFILE_QUERY_KEY],
        });

        toast.success("Settings saved");
      } catch (error) {
        console.error("Error invalidating org-users and profile query", error);
      }
    },
    onError: (error: AxiosError) => {
      console.error("Error saving org-users", error);
      const errorMessage = (error.response?.data as { error: string })?.error;
      if (errorMessage) {
        toast.error(errorMessage);
      }
    },
  });

  const handleSave = () => {
    saveOrgGroupSidebarMutation.mutate({
      accessToken: accessToken ?? "",
      id: activeMQTTProfile?.group_id ?? "",
      userGroup: {
        nav_items: deserializedNavItems,
      },
    });
  };

  const isLoading = saveOrgGroupSidebarMutation.isLoading;

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

            <Switch checked={editMode} onCheckedChange={setEditMode} />
          </div>
        </div>
      </div>
      <div className="text-end">
        <Button onClick={handleSave} disabled={!editMode || isLoading}>
          {isLoading ? "Saving..." : "Save"}
        </Button>
      </div>
    </div>
  );
}
