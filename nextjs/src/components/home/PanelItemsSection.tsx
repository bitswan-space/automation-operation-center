"use client";

import { Braces } from "lucide-react";
import { DynamicIcon } from "../layout/Sidebar/DynamicIcon";
import { FaFolderOpen } from "react-icons/fa";
import PanelItemCard from "./PanelItemCard";
import { type RawNavItem } from "../layout/Sidebar/utils/NavItems";
import React from "react";
import { usePathname } from "next/navigation";
import { useSidebarItems } from "@/context/SideBarItemsProvider";

type PanelItemsSectionProps = {
  showDefaultItems?: boolean;
  sidebarItems?: RawNavItem[];
};

export default function PanelItemsSection(props: PanelItemsSectionProps) {
  const { deserializedNavItems: sidebarItems } = useSidebarItems();
  const { showDefaultItems = false } = props;

  const sidebarItemsToUse = props.sidebarItems ?? sidebarItems;

  const pathname = usePathname();

  const [isMounted, setIsMounted] = React.useState(false);

  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return null;
  }
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
      {showDefaultItems && (
        <PanelItemCard
          key={"pipeline_card"}
          icon={<Braces size={32} className="text-neutral-900" />}
          title={"Pipelines"}
          url={"/dashboard/pipelines"}
        />
      )}
      {sidebarItemsToUse?.map((item) => (
        <PanelItemCard
          key={item.id + "card"}
          icon={
            item.type === "folder" ? (
              <FaFolderOpen size={32} className="text-neutral-900" />
            ) : (
              <DynamicIcon
                name={item.icon}
                size={24}
                className="text-neutral-500"
                title={item.icon}
              />
            )
          }
          title={item.name}
          url={item.type === "folder" ? `${pathname}/${item.id}` : item.link}
        />
      ))}
    </div>
  );
}
