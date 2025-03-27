import { TitleBarContent } from "./TitlebarContent";
import React, { type ReactNode } from "react";

import { fetchMQTTProfiles } from "@/server/actions/mqtt-profiles";

interface TitleBarProps {
  title: ReactNode;
  className?: string;
}

export async function TitleBar(props: Readonly<TitleBarProps>) {
  const { title, className } = props;

  const mqttProfilesRes = await fetchMQTTProfiles();

  return (
    <TitleBarContent
      className={className}
      title={title}
      mqttProfilesRes={mqttProfilesRes}
    />
  );
}
