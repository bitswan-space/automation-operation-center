"use client";

import { Workflow } from "lucide-react";
import { type MQTTProfile } from "@/server/actions/mqtt-profiles";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

import { ACTIVE_MQTT_PROFILE_STORAGE_KEY } from "@/shared/constants";
import React from "react";
import useLocalStorageState from "ahooks/lib/useLocalStorageState";

type MQTTProfileSelectorProps = {
  mqttProfiles: MQTTProfile[];
};

export default function MQTTProfileSelector(props: MQTTProfileSelectorProps) {
  const { mqttProfiles } = props;

  const [activeMQTTProfile, saveActiveMQTTProfile] = useLocalStorageState<
    MQTTProfile | undefined
  >(ACTIVE_MQTT_PROFILE_STORAGE_KEY, {
    defaultValue: mqttProfiles?.[0],
    listenStorageChange: true,
  });

  const handleActiveMQTTUserChange = (orgGroupId: string) => {
    void saveActiveMQTTProfile(
      mqttProfiles?.find((profile) => profile.id === orgGroupId),
    );
  };

  return (
    <Select
      value={activeMQTTProfile?.id}
      onValueChange={handleActiveMQTTUserChange}
    >
      <SelectTrigger className="w-[280px] bg-neutral-100">
        <div className="flex items-center gap-2">
          <Workflow
            size={20}
            strokeWidth={2.0}
            className="mr-2 text-neutral-600"
          />

          <SelectValue
            placeholder={"Select profile"}
            defaultValue={activeMQTTProfile?.id}
            className="font-medium"
          />
        </div>
      </SelectTrigger>
      <SelectContent className="bg-neutral-100">
        <SelectGroup>
          <SelectLabel>
            <div>MQTT profiles</div>
            {mqttProfiles?.length === 0 && (
              <div className="mt-2 flex h-16 flex-col items-center justify-center gap-2 rounded border border-dashed">
                <div className="text-center text-sm font-normal text-neutral-500">
                  No mqtt profiles found
                </div>
              </div>
            )}
          </SelectLabel>
          {mqttProfiles?.map((orgGroup) => (
            <SelectItem key={orgGroup.id} value={orgGroup.id}>
              {orgGroup.name}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}
