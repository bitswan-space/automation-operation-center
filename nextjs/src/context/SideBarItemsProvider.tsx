"use client";

import React from "react";
import { type NodeModel } from "@minoru/react-dnd-treeview";
import {
  deserializeNavItems,
  type RawNavItem,
  useSerializedNavItemData,
  type NavItem,
} from "@/components/layout/Sidebar/utils/NavItems";

import { type Profile } from "@/data/profiles";

type SidebarItemsContext = {
  activeProfile: Profile | undefined;
  setActiveProfile: (profile: Profile | undefined) => void;
  sidebarItems: NodeModel<NavItem>[];
  setSidebarItems: (items: NodeModel<NavItem>[]) => void;
  deserializedNavItems: RawNavItem[];
};

export const SidebarItemsContext =
  React.createContext<SidebarItemsContext | null>(null);

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
  const [activeProfile, setActiveProfile] = React.useState<Profile | undefined>(undefined);
  
  // Get the initial items
  const sourceItems = useSerializedNavItemData(activeProfile?.nav_items ?? []);

  // Use one state instead of updating based on source changes
  const [sidebarItemsState, setSidebarItemsState] = React.useState<
    NodeModel<NavItem>[]
  >(() => sourceItems);

  React.useEffect(() => {
    setSidebarItemsState((prevItems) => {
      // Simple length check first
      if (prevItems.length !== sourceItems.length) {
        return sourceItems;
      }
      
      // Check if the actual data changed
      const hasChanged = prevItems.some((item, index) => {
        const sourceItem = sourceItems[index];
        return !sourceItem || 
               item.text !== sourceItem.text || 
               item.data?.href !== sourceItem.data?.href ||
               item.data?.type !== sourceItem.data?.type;
      });
      
      return hasChanged ? sourceItems : prevItems;
    });
  }, [sourceItems]);

  const deserializedNavItems = React.useMemo(
    () => deserializeNavItems(sidebarItemsState),
    [sidebarItemsState],
  );

  const setSidebarItems = React.useCallback((items: NodeModel<NavItem>[]) => {
    setSidebarItemsState(items);
  }, []);

  const contextValue = React.useMemo(
    () => ({
      activeProfile,
      setActiveProfile,
      sidebarItems: sidebarItemsState,
      setSidebarItems,
      deserializedNavItems,
    }),
    [sidebarItemsState, setSidebarItems, deserializedNavItems, activeProfile, setActiveProfile],
  );

  return (
    <SidebarItemsContext.Provider value={contextValue}>
      {children}
    </SidebarItemsContext.Provider>
  );
}
