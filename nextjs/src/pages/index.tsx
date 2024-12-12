import { Card, CardContent } from "@/components/ui/card";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { type NextPageWithLayout } from "./_app";
import { type ReactElement } from "react";
import { TitleBar } from "@/components/layout/TitleBar";
import { SideBarContext } from "@/context/sideBarContext";
import { type DynamicSidebarItem } from "@/types/sidebar";
import React from "react";
import clsx from "clsx";
import Link from "next/link";

const MainHomePage: NextPageWithLayout = () => {
  const sideBarItems = React.useContext(SideBarContext);

  const getURLFromType = (type: string, item: DynamicSidebarItem) => {
    switch (type) {
      case "external-link":
        return item.properties.link.href ?? "/";
      case "iframe-link":
        return `/iframe?iframeUrl=${item.properties.link.href}&title=${item.properties.name}`;
      default:
        return "/pipelines";
    }
  };

  return (
    <div className="p-4 lg:px-8 ">
      <h1 className="text-2xl font-bold text-neutral-700 md:hidden">
        PoC Admin Panel
      </h1>
      <div className="max-w-8xl inset-x-0 mx-auto mt-4">
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

      <div className="max-w-8xl mx-auto flex flex-col gap-8 pt-6">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {sideBarItems?.map((item) => (
            <PanelActionCard
              key={item.properties.name + "card"}
              icon={
                <div
                  className={clsx(
                    "h-8 w-6 items-center justify-center bg-blue-600",
                  )}
                  style={{
                    WebkitMaskImage: `url(${item.properties.icon.src})`,
                    WebkitMaskRepeat: "no-repeat",
                    WebkitMaskSize: "contain",
                    maskImage: `url(${item.properties.icon.src})`,
                  }}
                ></div>
              }
              title={item.properties.name}
              type={item.properties.link.type}
              url={getURLFromType(item.properties.link.type, item)}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default MainHomePage;

MainHomePage.getLayout = function getLayout(page: ReactElement) {
  return <DashboardLayout>{page}</DashboardLayout>;
};

type PanelActionCardProps = {
  title: string;
  icon: React.ReactNode;
  url: string;
  type: string;
};

function PanelActionCard(props: PanelActionCardProps) {
  const { title, icon, url, type } = props;

  return (
    <Card className="h-40 rounded-md border-neutral-300 shadow-sm hover:cursor-pointer">
      <CardContent className="h-full pt-4">
        <Link href={url} target={type === "external-link" ? "_blank": ""}>
          <div className="my-auto flex h-full flex-col justify-center gap-3 pt-4 text-center">
            <div className=" mx-auto text-blue-600">{icon}</div>
            <div className="mx-auto flex  gap-2 align-bottom">
              <div className="mt-auto text-base   capitalize text-neutral-700">
                {title}
              </div>
            </div>
          </div>
        </Link>
      </CardContent>
    </Card>
  );
}
