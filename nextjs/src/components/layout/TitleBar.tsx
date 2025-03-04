import { TitleBarContent } from "./TitlebarContent";
import React, { type ReactNode } from "react";

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
    <TitleBarContent
      className={className}
      title={title}
      mqttProfiles={mqttProfiles}
    />
  );
}
