"use client";

import React, { useEffect } from "react";
import { type NodeModel } from "@minoru/react-dnd-treeview";
import {
  deserializeNavItems,
  type RawNavItem,
  useSerializedNavItemData,
  type NavItem,
} from "@/components/layout/Sidebar/utils/NavItems";

import { type Profile } from "@/data/profiles";
import { updateOrgGroup } from "@/data/groups";
import { PROFILES_QUERY_KEY, useProfilesQuery } from "@/hooks/useProfilesQuery";
import { useQueryClient } from "@tanstack/react-query";

type SidebarItemsType = {
  profiles: Profile[];
  activeProfile: Profile | undefined;
  setActiveProfile: (profile: Profile | undefined) => void;
  sidebarItems: NodeModel<NavItem>[];
  setSidebarItems: (items: NodeModel<NavItem>[]) => void;
  deserializedNavItems: RawNavItem[];
};

export const SidebarItemsContext =
  React.createContext<SidebarItemsType | null>(null);

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
  const queryClient = useQueryClient();
  const { data: profilesData } = useProfilesQuery();
  // Flatten all pages from infinite query into a single array
  const profiles = React.useMemo(() => {
    if (!profilesData?.pages) return [];
    return profilesData.pages.flatMap((page) => page.results ?? []);
  }, [profilesData?.pages]);

  // Set active profile when profiles are loaded
  useEffect(() => {
    if (profiles.length > 0 && !activeProfile) {
      setActiveProfile(profiles[0]);
    }
  }, [profiles, activeProfile]);
  
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

  React.useEffect(() => {
    // Don't update the user merged profile
    if (activeProfile?.id === "merged") return;

    const updateNavItems = async () => {
      // Only update if we have a valid activeProfile with an ID
      if (activeProfile?.id) {
        await updateOrgGroup({
          id: activeProfile.id,
          name: activeProfile.name,
          nav_items: JSON.stringify(deserializedNavItems),
        });

        // Invalidate profiles query to refresh data
        queryClient.invalidateQueries({ queryKey: PROFILES_QUERY_KEY });
      }
    }
    updateNavItems();
  }, [deserializedNavItems, activeProfile?.id, activeProfile?.name]);

  const contextValue = React.useMemo(
    () => ({
      profiles,
      activeProfile,
      setActiveProfile,
      sidebarItems: sidebarItemsState,
      setSidebarItems,
      deserializedNavItems,
    }),
    [sidebarItemsState, setSidebarItems, deserializedNavItems, activeProfile, setActiveProfile, profiles],
  );

  return (
    <SidebarItemsContext.Provider value={contextValue}>
      {children}
    </SidebarItemsContext.Provider>
  );
}
