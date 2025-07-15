"use client";

import { Workflow } from "lucide-react";
import {
  type MQTTProfile,
  type MQTTProfileListResponse,
} from "@/server/actions/mqtt-profiles";
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
  mqttProfiles?: MQTTProfileListResponse;
};

export default function MQTTProfileSelector(props: MQTTProfileSelectorProps) {
  const { mqttProfiles } = props;

  const [activeMQTTProfile, saveActiveMQTTProfile] = useLocalStorageState<
    MQTTProfile | undefined
  >(ACTIVE_MQTT_PROFILE_STORAGE_KEY, {
    listenStorageChange: true,
  });

  React.useEffect(() => {
    if (!activeMQTTProfile && mqttProfiles?.results?.[0]) {
      saveActiveMQTTProfile(mqttProfiles?.results?.[0]);
    }
  }, [activeMQTTProfile, mqttProfiles?.results, saveActiveMQTTProfile]);

  const handleActiveMQTTUserChange = (orgGroupId: string) => {
    void saveActiveMQTTProfile(
      mqttProfiles?.results?.find((profile) => profile.id === orgGroupId),
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
            <div>Groups</div>
            {mqttProfiles?.results?.length === 0 && (
              <div className="mt-2 flex h-16 flex-col items-center justify-center gap-2 rounded border border-dashed">
                <div className="text-center text-sm font-normal text-neutral-500">
                  No groups found
                </div>
              </div>
            )}
          </SelectLabel>
          {mqttProfiles?.results?.map((orgGroup) => (
            <SelectItem key={orgGroup.id} value={orgGroup.id}>
              {orgGroup.name}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}
