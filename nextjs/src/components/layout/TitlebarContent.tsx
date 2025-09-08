import { type MQTTProfileListResponse } from "@/data/mqtt-profiles";
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
      <div className="border-border flex flex-col border-b px-4 py-4 md:py-6">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div className="space-y-2">
            <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
              {title}
            </h1>
          </div>

          <div className="ml-auto flex items-center justify-end gap-4 pr-2">
            <div className="my-auto">
              <Suspense fallback={<Skeleton className="h-10 w-60" />}>
                <MQTTProfileSelector mqttProfiles={mqttProfiles} />
              </Suspense>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
