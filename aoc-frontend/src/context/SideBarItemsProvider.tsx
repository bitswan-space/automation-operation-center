"use client";

import React from "react";
import { type NodeModel } from "@minoru/react-dnd-treeview";
import {
  deserializeNavItems,
  type RawNavItem,
  type NavItem,
} from "@/components/layout/Sidebar/utils/NavItems";

import { stringify } from "flatted";

type SidebarItemsContext = {
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

// TODO: fix nav items
export function SidebarItemsProvider({
  children,
}: React.PropsWithChildren<unknown>) {
  // Use one state instead of updating based on source changes
  const [sidebarItemsState, setSidebarItemsState] = React.useState<
    NodeModel<NavItem>[]
  >([]);

  // Only update state when source items actually change
  React.useEffect(() => {
    setSidebarItemsState((prevItems) => {
      // Optional: Add deep comparison if needed
      if (stringify(prevItems) !== stringify([])) {
        return [];
      }
      return prevItems;
    });
  }, []);

  const deserializedNavItems = React.useMemo(
    () => deserializeNavItems(sidebarItemsState),
    [sidebarItemsState],
  );

  const setSidebarItems = React.useCallback((items: NodeModel<NavItem>[]) => {
    setSidebarItemsState(items);
  }, []);

  const contextValue = React.useMemo(
    () => ({
      sidebarItems: sidebarItemsState,
      setSidebarItems,
      deserializedNavItems,
    }),
    [sidebarItemsState, setSidebarItems, deserializedNavItems],
  );

  return (
    <SidebarItemsContext.Provider value={contextValue}>
      {children}
    </SidebarItemsContext.Provider>
  );
}