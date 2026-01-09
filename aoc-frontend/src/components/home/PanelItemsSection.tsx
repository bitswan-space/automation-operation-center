import { DynamicIcon } from "../layout/Sidebar/DynamicIcon";
import PanelItemCard from "./PanelItemCard";
import React from "react";
import { useSidebarItems } from "@/context/SideBarItemsProvider";
import PanelItemFolder from "./PanelItemFolder";


export default function PanelItemsSection() {
  const { deserializedNavItems: sidebarItems } = useSidebarItems();

  const [isMounted, setIsMounted] = React.useState(false);

  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return null;
  }
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
      {sidebarItems?.map((item) => (
        item.type === "folder" ? (
          <PanelItemFolder
            key={item.id + "folder"}
            title={item.name}
            items={item.children ?? []}
          />
        ) : (
        <PanelItemCard
          key={item.id + "card"}
          icon={
            <DynamicIcon
              name={item.icon}
              size={24}
              className="text-neutral-500"
              title={item.icon}
            />
          }
          title={item.name}
          url={item.link}
        />
      )))}
    </div>
  );
}