import { TitleBarContent } from "./TitlebarContent";
import React, { type ReactNode } from "react";

import { fetchMQTTProfiles } from "@/data/mqtt-profiles";

interface TitleBarProps {
  title: ReactNode;
  className?: string;
}

export async function TitleBar(props: Readonly<TitleBarProps>) {
  const { title, className } = props;

  const mqttProfiles = await fetchMQTTProfiles();

  return (
    <TitleBarContent
      className={className}
      title={title}
      mqttProfiles={mqttProfiles}
    />
  );
}
