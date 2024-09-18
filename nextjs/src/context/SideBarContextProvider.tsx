import { useDynamicSidebar } from "@/components/layout/hooks";
import { type DynamicSidebarItem } from "@/types/sidebar";
import React from "react";

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
