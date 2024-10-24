"use client";

import { useMQTTRequestResponse } from "@/shared/hooks/useMQTTRequestResponse";
import {
  type DynamicSidebarResponse,
  type DynamicSidebarItem,
} from "@/types/sidebar";
import React from "react";

export const useDynamicSidebar = () => {
  const { response: sidebarRes } =
    useMQTTRequestResponse<DynamicSidebarResponse>({
      requestTopic: "/topology/subscribe",
      responseTopic: "/topology",
    });

  const sideBarItems = Object.entries(sidebarRes?.topology ?? {}).reduce(
    (acc, v) => {
      return [...acc, v[1] as DynamicSidebarItem];
    },
    [] as DynamicSidebarItem[],
  );

  return { sideBarItems };
};

export const SideBarContext = React.createContext<DynamicSidebarItem[] | null>(
  null,
);

export function useSideBarItemsSource() {
  const { sideBarItems } = useDynamicSidebar();

  return sideBarItems;
}

export function useSideBarContext() {
  const context = React.useContext(SideBarContext);

  return context;
}

export function SideBarContextProvider({
  children,
}: React.PropsWithChildren<unknown>) {
  return (
    <SideBarContext.Provider value={useSideBarItemsSource()}>
      {children}
    </SideBarContext.Provider>
  );
}
