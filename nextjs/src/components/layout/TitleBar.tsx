import { TitleBarContent } from "./TitlebarContent";
import React, { type ReactNode } from "react";

import { fetchMQTTProfiles } from "@/data/mqtt-profiles";
import { fetchOrgs, getActiveOrgFromCookies } from "@/data/organisations";

interface TitleBarProps {
  title: ReactNode;
  className?: string;
}

export async function TitleBar(props: Readonly<TitleBarProps>) {
  const { title, className } = props;

  const mqttProfiles = await fetchMQTTProfiles();
  const orgRes = await fetchOrgs();

  const activeOrg = await getActiveOrgFromCookies();

  return (
    <TitleBarContent
      className={className}
      title={title}
      mqttProfiles={mqttProfiles}
      orgs={orgRes}
      activeOrg={activeOrg}
    />
  );
}
