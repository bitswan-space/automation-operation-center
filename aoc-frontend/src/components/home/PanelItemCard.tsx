"use client";

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
    <Card className="h-40 rounded-md border-neutral-300 shadow-sm hover:cursor-pointer">
      <CardContent className="h-full pt-4">
        <Link to={url ?? "#"}>
          <div className="my-auto flex h-full flex-col justify-center gap-3 pt-4 text-center">
            <div className=" mx-auto text-blue-600">{icon}</div>
            <div className="mx-auto flex  gap-2 align-bottom">
              <div className="mt-auto text-sm text-neutral-700">{title}</div>
            </div>
          </div>
        </Link>
      </CardContent>
    </Card>
  );
}