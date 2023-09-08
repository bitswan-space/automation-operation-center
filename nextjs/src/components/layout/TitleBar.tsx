import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { BellDot, LogOut } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

import React from "react";

interface TitleBarProps {
  title: string;
}

export function TitleBar(props: TitleBarProps) {
  const { title } = props;

  return (
    <div className="hidden md:block">
      <Card
        className={
          "h-full w-full rounded-lg border border-slate-300 shadow-none"
        }
      >
        <CardContent className="flex justify-between px-5 py-4">
          <h1 className="text-3xl font-bold text-stone-700 md:text-2xl">
            {title}
          </h1>
          <div className="flex gap-4">
            <Avatar>
              <AvatarImage src="https://github.com/shadcn.png" />
              <AvatarFallback>CN</AvatarFallback>
            </Avatar>
            <div>
              <div className="font-semibold text-slate-800">Andrew Smith</div>
              <div className="text-[10px] underline">PRODUCT OWNER</div>
            </div>
            <BellDot size={25} className="my-auto" />
            <LogOut size={25} className="my-auto" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
