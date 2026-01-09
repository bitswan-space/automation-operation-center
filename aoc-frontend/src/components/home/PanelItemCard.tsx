import { Card, CardContent } from "../ui/card";
import { Link } from "react-router-dom";
import React from "react";

type PanelItemCardProps = {
  title: string;
  icon: React.ReactNode;
  url?: string;
};

export default function PanelItemCard(props: PanelItemCardProps) {
  const { title, icon, url } = props;
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
        <Link to={url ?? "#"} target="_blank">
          <div className="my-auto flex h-full flex-col justify-center gap-3 pt-4 text-center">
            <div className="mx-auto">{icon}</div>
            <div className="mx-auto flex w-full gap-2 align-bottom px-2">
              <div
                className="mt-auto text-base font-semibold text-card-foreground text-wrap break-words w-full max-h-[72px] overflow-y-hidden"
                style={{ overflowWrap: "anywhere" }}
              >
                {title}
              </div>
            </div>
          </div>
        </Link>
      </CardContent>
    </Card>
  );
}
