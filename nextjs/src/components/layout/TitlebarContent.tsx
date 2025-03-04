import { Card, CardContent } from "../ui/card";

import { type MQTTProfileListResponse } from "@/server/actions/mqtt-profiles";
import MQTTProfileSelector from "../groups/MQTTProfileSelector";
import { Skeleton } from "../ui/skeleton";
import { Suspense } from "react";
import clsx from "clsx";

export type TitleBarContentProps = {
  className?: string;
  title: React.ReactNode;
  mqttProfiles?: MQTTProfileListResponse;
};
export function TitleBarContent(props: TitleBarContentProps) {
  const { className, title, mqttProfiles } = props;
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
