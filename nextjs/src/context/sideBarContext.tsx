import { type DynamicSidebarItem } from "@/types/sidebar";
import React from "react";

export const SideBarContext = React.createContext<DynamicSidebarItem[] | null>(
  null,
);
