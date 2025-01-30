import { Card, CardContent } from "@/components/ui/card";
import React, { Suspense, type ReactNode } from "react";

import clsx from "clsx";

import { Skeleton } from "../ui/skeleton";

import MQTTProfileSelector from "../groups/MQTTProfileSelector";
import { fetchMQTTProfiles } from "@/server/actions/mqtt-profiles";
import { auth } from "@/server/auth";

interface TitleBarProps {
  title: ReactNode;
  className?: string;
}

export async function TitleBar(props: Readonly<TitleBarProps>) {
  const { title, className } = props;

  const session = await auth();
  const mqttProfiles = await fetchMQTTProfiles(session);

  return (
    <div className={clsx("hidden md:block", className)}>
      <Card
        className={clsx(
          "h-full w-full rounded-lg border border-slate-300 shadow-none",
          "dark:border-neutral-200 dark:bg-neutral-800",
        )}
      >
        <CardContent className="flex justify-between px-5 py-4 align-middle">
          <h1 className="text-3xl font-bold text-neutral-700 dark:text-neutral-200 md:text-2xl">
            {title}
          </h1>

          <div className="flex gap-4 pr-2">
            <div className="my-auto w-full">
              <Suspense fallback={<Skeleton className="h-10 w-60" />}>
                <MQTTProfileSelector mqttProfiles={mqttProfiles} />
              </Suspense>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
