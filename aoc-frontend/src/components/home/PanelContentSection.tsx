"use client";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "../ui/breadcrumb";

import PanelItemsSection from "./PanelItemsSection";
import React from "react";
import { useRouter } from "next/navigation";
import { useSidebarItems } from "@/context/SideBarItemsProvider";

type PanelContentSectionProps = {
  item_ids: string[];
};

export function PanelContentSection(props: PanelContentSectionProps) {
  const { item_ids } = props;
  const { deserializedNavItems } = useSidebarItems();
  const router = useRouter();

  const items = React.useMemo(() => {
    if (item_ids.length > 0) {
      const lastId = parseInt(item_ids[item_ids.length - 1] ?? "", 10);
      console.log("found last id", lastId);
      return (
        deserializedNavItems?.find((item) => item.id === lastId)?.children ?? []
      );
    }
    return [];
  }, [deserializedNavItems, item_ids]);

  const generateBreadcrumbs = React.useCallback(() => {
    const breadcrumbs = [{ name: "Home", href: "/dashboard" }];

    let currentPath = "/dashboard";
    let currentItems = deserializedNavItems;

    for (const id of item_ids) {
      const item = currentItems?.find((item) => item.id === parseInt(id, 10));
      if (item) {
        currentPath += `/${id}`;
        breadcrumbs.push({ name: item.name, href: currentPath });
        currentItems = item.children ?? [];
      } else {
        break;
      }
    }

    return breadcrumbs;
  }, [deserializedNavItems, item_ids]);

  const breadcrumbs = generateBreadcrumbs();

  React.useEffect(() => {
    if (breadcrumbs.length === 1) {
      router.push("/dashboard");
    }
  }, [breadcrumbs, router]);

  console.log("items", items);

  return (
    <>
      {breadcrumbs.length > 1 && (
        <Breadcrumb className="mb-4 mt-6">
          <BreadcrumbList>
            {breadcrumbs.map((crumb, index) => (
              <React.Fragment key={crumb.href}>
                <BreadcrumbItem>
                  {index === breadcrumbs.length - 1 ? (
                    <BreadcrumbPage>{crumb.name}</BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink href={crumb.href}>
                      {crumb.name}
                    </BreadcrumbLink>
                  )}
                </BreadcrumbItem>
                {index < breadcrumbs.length - 1 && <BreadcrumbSeparator />}
              </React.Fragment>
            ))}
          </BreadcrumbList>
        </Breadcrumb>
      )}

      <div className="mx-auto mt-6 flex flex-col gap-8">
        <PanelItemsSection sidebarItems={items} />
      </div>
    </>
  );
}
