import { Loader2, Workflow } from "lucide-react";
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
import { Skeleton } from "../ui/skeleton";
import useLocalStorageState from "ahooks/lib/useLocalStorageState";
import { useMQTTProfileList } from "./groupsHooks";

export function MQTTProfileSelector() {
  const { data: mqttProfiles, isLoading } = useMQTTProfileList();

  const [activeMQTTProfile, saveActiveMQTTProfile] = useLocalStorageState<
    string | undefined
  >(ACTIVE_MQTT_PROFILE_STORAGE_KEY, {
    defaultValue: mqttProfiles?.results?.[0]?.id ?? "",
    listenStorageChange: true,
  });

  const handleActiveMQTTUserChange = (orgGroupId: string) => {
    void saveActiveMQTTProfile(orgGroupId);
  };

  return (
    <Select
      value={activeMQTTProfile ?? undefined}
      onValueChange={handleActiveMQTTUserChange}
    >
      <SelectTrigger className="w-[250px] bg-neutral-100">
        <div className="flex items-center gap-2">
          {isLoading ? (
            <Loader2 size={20} className="mr-2 animate-spin" />
          ) : (
            <Workflow
              size={20}
              strokeWidth={2.0}
              className="mr-2 text-neutral-600"
            />
          )}
          <SelectValue
            placeholder="Select mqtt user"
            defaultValue={activeMQTTProfile ?? undefined}
            className="font-medium"
          />
        </div>
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>
            <div>MQTT profiles</div>
            {isLoading && <Skeleton className="mt-2 h-10 w-full" />}
            {mqttProfiles?.results?.length === 0 && (
              <div className="mt-2 flex h-16 flex-col items-center justify-center gap-2 rounded border border-dashed">
                <div className="text-center text-sm font-normal text-neutral-500">
                  No mqtt profiles found
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
