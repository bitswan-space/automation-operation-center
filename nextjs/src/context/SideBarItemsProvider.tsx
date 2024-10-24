"use client";

import React from "react";
import { type NodeModel } from "@minoru/react-dnd-treeview";
import {
  deserializeNavItems,
  type RawNavItem,
  useSerializedNavItemData,
  type NavItem,
} from "@/components/layout/Sidebar/utils/NavItems";
import useLocalStorageState from "ahooks/lib/useLocalStorageState";
import { type MQTTProfile } from "@/components/groups/groupsHooks";
import { ACTIVE_MQTT_PROFILE_STORAGE_KEY } from "@/shared/constants";

type SidebarItemsContext = {
  sidebarItems: NodeModel<NavItem>[];
  setSidebarItems: (items: NodeModel<NavItem>[]) => void;
  deserializedNavItems: RawNavItem[];
};

export const SidebarItemsContext =
  React.createContext<SidebarItemsContext | null>(null);

export function useSidebarItemsSource() {
  const [activeMQTTProfile] = useLocalStorageState<MQTTProfile | undefined>(
    ACTIVE_MQTT_PROFILE_STORAGE_KEY,
    {
      listenStorageChange: true,
    },
  );

  return useSerializedNavItemData(activeMQTTProfile?.nav_items ?? []);
}

export function useSidebarItems() {
  const context = React.useContext(SidebarItemsContext);
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarItemsProvider");
  }

  return context;
}

export function SidebarItemsProvider({
  children,
}: React.PropsWithChildren<unknown>) {
  const sidebarItems = useSidebarItemsSource();

  const [_sidebarItemsState, _setSidebarItemsState] =
    React.useState<NodeModel<NavItem>[]>(sidebarItems);

  const sidebarItemsState = _sidebarItemsState;

  React.useEffect(() => {
    _setSidebarItemsState(sidebarItems);
  }, [sidebarItems]);

  const deserializedNavItems = React.useMemo(
    () => deserializeNavItems(sidebarItemsState),
    [sidebarItemsState],
  );

  const setSidebarItems = React.useCallback((items: NodeModel<NavItem>[]) => {
    _setSidebarItemsState(items);
  }, []);

  const contextValue = React.useMemo(
    () => ({
      sidebarItems: sidebarItemsState,
      setSidebarItems: setSidebarItems,
      deserializedNavItems: deserializedNavItems,
    }),
    [sidebarItemsState, setSidebarItems, deserializedNavItems],
  );

  return (
    <SidebarItemsContext.Provider value={contextValue}>
      {children}
    </SidebarItemsContext.Provider>
  );
}
