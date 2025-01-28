import { Card, CardContent } from "@/components/ui/card";
import React, { Suspense, type ReactNode } from "react";

import clsx from "clsx";
import dynamic from "next/dynamic";

import { Skeleton } from "../ui/skeleton";

import MQTTProfileSelector from "../groups/MQTTProfileSelector";

interface TitleBarProps {
  title: ReactNode;
  className?: string;
}

export function TitleBar(props: Readonly<TitleBarProps>) {
  const { title, className } = props;

  return (
    <div className={clsx("hidden md:block", className)}>
      <Card
        className={clsx(
          "h-full w-full rounded-lg border border-slate-300 shadow-none",
          "dark:border-neutral-200 dark:bg-neutral-800",
        )}
      >
        <CardContent className="flex justify-between px-5 py-4 align-middle">
          <h1 className="text-3xl font-bold text-neutral-700 md:text-2xl dark:text-neutral-200">
            {title}
          </h1>

          <div className="flex gap-4 pr-2">
            <div className="my-auto w-full">
              <Suspense fallback={<Skeleton className="h-10 w-60" />}>
                <MQTTProfileSelector />
              </Suspense>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
