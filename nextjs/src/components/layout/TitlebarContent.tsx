import { Card, CardContent } from "../ui/card";

import clsx from "clsx";
import { OrgSwitcher } from "../organizations/org-switcher";
import { type Organisation, type OrgListResponse } from "@/data/organisations";

export type TitleBarContentProps = {
  className?: string;
  title: React.ReactNode;
  orgs?: OrgListResponse;
  activeOrg?: Organisation;
};
export function TitleBarContent(props: TitleBarContentProps) {
  const { className, title, orgs, activeOrg } = props;
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

          <div className="ml-auto flex items-center justify-end gap-4 pr-2">
            <OrgSwitcher orgs={orgs?.results ?? []} activeOrg={activeOrg} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


