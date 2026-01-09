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
  // Track if we're updating due to a profile switch (not user modification)
  const isProfileSwitchRef = React.useRef(false);
  // Track if sidebar items were modified by user
  const userModifiedRef = React.useRef(false);
  
  // Flatten all pages from infinite query into a single array
  const profiles = React.useMemo(() => {
    if (!profilesData?.pages) return [];
    return profilesData.pages.flatMap((page) => page.results ?? []);
  }, [profilesData?.pages]);

  // Set active profile when profiles are loaded
  useEffect(() => {
    if (profiles.length > 0 && !activeProfile) {
      // Initial profile load - mark as profile switch to prevent update
      isProfileSwitchRef.current = true;
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
    // If this is a profile switch, mark it and reset user modification flag
    if (isProfileSwitchRef.current) {
      userModifiedRef.current = false;
      isProfileSwitchRef.current = false;
    }
    
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
    // Mark that user has modified the items
    userModifiedRef.current = true;
    setSidebarItemsState(items);
  }, []);

  // Wrapper for setActiveProfile that marks profile switch
  const handleSetActiveProfile = React.useCallback((profile: Profile | undefined) => {
    isProfileSwitchRef.current = true;
    setActiveProfile(profile);
  }, []);

  React.useEffect(() => {
    // Don't update the user merged profile
    if (activeProfile?.id === "merged") return;
    
    // Only update if user has modified the sidebar items
    // Skip updates when switching profiles
    if (!userModifiedRef.current) return;

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
        // Reset the flag after successful update
        userModifiedRef.current = false;
      }
    }
    updateNavItems();
  }, [deserializedNavItems, activeProfile?.id, activeProfile?.name, queryClient]);

  const contextValue = React.useMemo(
    () => ({
      profiles,
      activeProfile,
      setActiveProfile: handleSetActiveProfile,
      sidebarItems: sidebarItemsState,
      setSidebarItems,
      deserializedNavItems,
    }),
    [sidebarItemsState, setSidebarItems, deserializedNavItems, activeProfile, handleSetActiveProfile, profiles],
  );

  return (
    <SidebarItemsContext.Provider value={contextValue}>
      {children}
    </SidebarItemsContext.Provider>
  );
}
