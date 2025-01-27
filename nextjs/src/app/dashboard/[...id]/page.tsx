"use client";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

import PanelItemsSection from "@/components/home/PanelItemsSection";
import React, { use } from "react";
import { TitleBar } from "@/components/layout/TitleBar";
import { useRouter } from "next/navigation";
import { useSidebarItems } from "@/context/SideBarItemsProvider";

export default function DahboardNestedPage(
  props: {
    params: Promise<{ id: string[] }>;
  }
) {
  const params = use(props.params);
  const { deserializedNavItems } = useSidebarItems();
  const router = useRouter();

  const items = React.useMemo(() => {
    if (params.id.length > 0) {
      const lastId = parseInt(params.id[params.id.length - 1] ?? "", 10);
      return (
        deserializedNavItems?.find((item) => item.id === lastId)?.children ?? []
      );
    }
    return [];
  }, [deserializedNavItems, params.id]);

  const generateBreadcrumbs = React.useCallback(() => {
    const breadcrumbs = [{ name: "Home", href: "/dashboard" }];

    let currentPath = "/dashboard";
    let currentItems = deserializedNavItems;

    for (const id of params.id) {
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
  }, [deserializedNavItems, params.id]);

  const breadcrumbs = generateBreadcrumbs();

  React.useEffect(() => {
    if (breadcrumbs.length === 1) {
      router.push("/dashboard");
    }
  }, [breadcrumbs, router]);

  return (
    <div className="w-full">
      <h1 className="text-2xl font-bold text-neutral-700 md:hidden">
        PoC Admin Panel
      </h1>
      <div className="inset-x-0 mx-auto mt-2">
        <TitleBar
          title={
            <div className="mt-1 flex h-full gap-4 text-center align-middle">
              <span>PoC Admin Panel</span>
            </div>
          }
        />
        <div className="pt-6 text-base">
          Welcome to the{" "}
          <strong className="font-semibold text-neutral-700">
            Bitswan Pipeline Operations Center,
          </strong>
        </div>
      </div>

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
    </div>
  );
}
