import SideNavBar, { MobileNavSheet } from "./SideNavBar";

import Image from "next/image";
import { MQTTUserProvider } from "@/context/MQTTBrokerProvider";
import React from "react";
import { SideBarContextProvider } from "@/context/SideBarContextProvider";
import { Toaster } from "../ui/sonner";
import clsx from "clsx";

interface LayoutProps {
  children: React.ReactNode;
}

function DashboardLayout({ children }: LayoutProps) {
  const [isExpanded] = React.useState<boolean>(false);

  return (
    <MQTTUserProvider>
      <SideBarContextProvider>
        <div className="font-strawford flex h-full min-h-screen flex-col bg-stone-100">
          <div className="flex flex-grow">
            <div className="fixed hidden h-screen bg-stone-200 md:block">
              <SideNavBar />
            </div>
            <main
              className={clsx("h-full flex-grow overflow-auto", {
                "md:pl-64": isExpanded,
                "md:pl-20": !isExpanded,
              })}
            >
              <div className="flex w-full justify-between bg-neutral-800 p-4 md:hidden">
                <Image
                  height={40}
                  width={140}
                  className="h-8 w-36"
                  src={"/bitswan-logo-full.png"}
                  alt="logo"
                />
                <MobileNavSheet />
              </div>
              {children}
            </main>
            <Toaster />
          </div>
        </div>
      </SideBarContextProvider>
    </MQTTUserProvider>
  );
}

export default DashboardLayout;
