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

import { ACTIVE_MQTT_USER_STORAGE_KEY } from "@/shared/constants";
import React from "react";
import { Skeleton } from "../ui/skeleton";
import useLocalStorageState from "ahooks/lib/useLocalStorageState";
import { useUserGroups } from "./groupsHooks";

export function MQTTUserSelector() {
  const { data: orgGroups, isLoading } = useUserGroups();

  const [activeMQTTUser, saveActiveMQTTUser] = useLocalStorageState<
    string | undefined
  >(ACTIVE_MQTT_USER_STORAGE_KEY, {
    defaultValue: orgGroups?.results?.[0]?.id ?? "",
    listenStorageChange: true,
  });

  const handleActiveMQTTUserChange = (orgGroupId: string) => {
    void saveActiveMQTTUser(orgGroupId);
  };

  return (
    <Select
      value={activeMQTTUser ?? undefined}
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
            defaultValue={activeMQTTUser ?? undefined}
            className="font-medium"
          />
        </div>
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>
            <div>Active mqtt users</div>
            {isLoading && <Skeleton className="mt-2 h-10 w-full" />}
            {orgGroups?.results?.length === 0 && (
              <div className="mt-2 flex h-16 flex-col items-center justify-center gap-2 rounded border border-dashed">
                <div className="text-center text-sm font-normal text-neutral-500">
                  No mqtt brokers found
                </div>
              </div>
            )}
          </SelectLabel>
          {orgGroups?.results?.map((orgGroup) => (
            <SelectItem key={orgGroup.id} value={orgGroup.id}>
              {orgGroup.name}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}
