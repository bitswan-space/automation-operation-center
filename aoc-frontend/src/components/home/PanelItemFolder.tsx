import { Card, CardContent } from "../ui/card";
import React from "react";
import { FolderClosed } from "lucide-react";
import { type RawNavItem } from "../layout/Sidebar/utils/NavItems";

type PanelItemFolderProps = {
  title: string;
  items: RawNavItem[];
  onClick: () => void;
};

export default function PanelItemFolder(props: PanelItemFolderProps) {
  const { title, onClick } = props;
  const [isMounted, setIsMounted] = React.useState(false);

  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return null;
  }

  return (
    <Card className="h-40 rounded-xl border-border shadow-sm hover:cursor-pointer">
      <CardContent className="h-full pt-4 p-1">
        <button onClick={onClick} className="w-full h-full">
          <div className="my-auto flex h-full flex-col justify-center gap-3 pt-4 text-center">
            <div className="mx-auto">
              <FolderClosed size={24} className="text-neutral-900" />
            </div>
            <div className="mx-auto flex w-full gap-2 align-bottom px-2">
              <div
                className="mt-auto text-base font-semibold text-card-foreground text-wrap break-words w-full max-h-[72px] overflow-y-hidden"
                style={{ overflowWrap: "anywhere" }}
              >
                {title}
              </div>
            </div>
          </div>
        </button>
      </CardContent>
    </Card>
  );
}
