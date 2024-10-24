"use client";

import React from "react";
import { type UserGroup, useUserGroups } from "@/components/groups/groupsHooks";

export const MQTTUserContext = React.createContext<UserGroup | undefined>(
  {} as unknown as UserGroup,
);

export function useMQTTBrokerSource() {
  const { data: orgGroups } = useUserGroups();

  const currentActiveMQTTUser = orgGroups?.results?.find(
    (broker) => broker.active,
  );

  return currentActiveMQTTUser;
}

export function useActiveMQTTUser() {
  const context = React.useContext(MQTTUserContext);

  return context;
}

export function MQTTUserProvider({
  children,
}: React.PropsWithChildren<unknown>) {
  const broker = useMQTTBrokerSource();

  return (
    <MQTTUserContext.Provider value={broker}>
      {children}
    </MQTTUserContext.Provider>
  );
}
