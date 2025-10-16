import { Card, CardContent } from "../ui/card";
import React from "react";
import { FolderClosed, FolderOpen } from "lucide-react";
import { type RawNavItem } from "../layout/Sidebar/utils/NavItems";
import PanelItemCard from "./PanelItemCard";
import { DynamicIcon } from "../layout/Sidebar/DynamicIcon";

type PanelItemFolderProps = {
  title: string;
  items: RawNavItem[];
};

export default function PanelItemFolder(props: PanelItemFolderProps) {
  const { title, items } = props;
  const [isMounted, setIsMounted] = React.useState(false);
  const [isOpen, setIsOpen] = React.useState(false);

  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return null;
  }

  return (
    <>
      <Card className="h-40 rounded-xl border-border shadow-sm">
        <CardContent className="h-full pt-4">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="w-full h-full"
          >
            <div className="my-auto flex h-full flex-col justify-center gap-3 pt-4 text-center">
              <div className=" mx-auto">
                {isOpen ? (
                  <FolderOpen size={24} className="text-neutral-900" />
                ) : (
                  <FolderClosed size={24} className="text-neutral-900" />
                )}
              </div>
              <div className="mx-auto flex  gap-2 align-bottom">
                <div className="mt-auto text-base font-semibold text-card-foreground">
                  {title}
                </div>
              </div>
            </div>
          </button>
        </CardContent>
      </Card>
      {isOpen && (
        <>
          {items?.map((item) =>
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
            )
          )}
        </>
      )}
    </>
  );
}
