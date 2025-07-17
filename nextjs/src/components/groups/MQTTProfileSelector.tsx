"use client";

import { ChevronsUpDown, Users } from "lucide-react";
import {
  type MQTTProfile,
  type MQTTProfileListResponse,
} from "@/data/mqtt-profiles";

import { ACTIVE_MQTT_PROFILE_STORAGE_KEY } from "@/shared/constants";
import React from "react";
import useLocalStorageState from "ahooks/lib/useLocalStorageState";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Button } from "../ui/button";

type MQTTProfileSelectorProps = {
  mqttProfiles?: MQTTProfileListResponse;
};

export default function MQTTProfileSelector(props: MQTTProfileSelectorProps) {
  const { mqttProfiles } = props;

  const [activeMQTTProfile, saveActiveMQTTProfile] = useLocalStorageState<
    MQTTProfile | undefined
  >(ACTIVE_MQTT_PROFILE_STORAGE_KEY, {
    listenStorageChange: true,
    defaultValue: mqttProfiles?.results?.[0],
  });

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild className="w-[180px] bg-neutral-100">
        <Button variant="outline" className="min-w-[200px] bg-neutral-100">
          <Users />
          <div className="grid flex-1 text-left text-sm leading-tight">
            <span className="truncate font-medium">
              {activeMQTTProfile?.name ?? "Select group"}
            </span>
          </div>
          <ChevronsUpDown className="ml-auto" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
        align="start"
        side={"bottom"}
        sideOffset={4}
      >
        <DropdownMenuLabel className="text-muted-foreground text-xs">
          Groups
        </DropdownMenuLabel>
        {mqttProfiles?.results?.length === 0 && (
          <div className="my-2 flex h-16 flex-col items-center justify-center gap-2 rounded border border-dashed">
            <div className="text-center text-xs font-normal text-neutral-500">
              No groups found
            </div>
          </div>
        )}
        {mqttProfiles?.results?.map((profile) => {
          return (
            <DropdownMenuItem
              key={profile.id}
              onClick={() => saveActiveMQTTProfile(profile)}
              className="gap-2 p-2"
            >
              {profile.name}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
