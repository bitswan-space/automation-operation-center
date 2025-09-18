import { TitleBarContent } from "./TitlebarContent";
import React, { type ReactNode } from "react";

import { fetchOrgs, getActiveOrgFromCookies } from "@/data/organisations";

interface TitleBarProps {
  title: ReactNode;
  className?: string;
}

export async function TitleBar(props: Readonly<TitleBarProps>) {
  const { title, className } = props;

  const orgRes = await fetchOrgs();

  const activeOrg = await getActiveOrgFromCookies();

  return (
    <TitleBarContent
      className={className}
      title={title}
      orgs={orgRes}
      activeOrg={activeOrg}
    />
  );
}
