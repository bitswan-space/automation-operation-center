"use client";

import { SidebarMenuButton, useSidebar } from "@/components/ui/sidebar";
import { Link } from "react-router-dom";

export function SidebarMenuLogo() {
  const { open } = useSidebar();
  return (
    <>
      {open && (
        <SidebarMenuButton
          size="lg"
          className="data-[state=open]:bg-sidebar-accent my-5 data-[state=open]:text-sidebar-accent-foreground"
        >
          <div className="flex items-center justify-center rounded-lg data-[state=open]:block w-full">
            <Link
              to={"/dashboard"}
              className={"flex justify-center text-center"}
            >
              <img
                src={"/bitswan-logo-dark.svg"}
                alt="bitswan logo"
                className="mx-auto transform duration-100 ease-in-out"
                width={150}
                height={100}
              />
            </Link>
          </div>
        </SidebarMenuButton>
      )}
      {!open && (
        <SidebarMenuButton
          size="lg"
          className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
        >
          <div className="mx-auto flex items-center justify-center rounded-lg w-full">
            <Link
              to={"/dashboard"}
              className={"mx-auto flex justify-center text-center"}
            >
              <img
                src={"/bitswan-logo-sm-dark.svg"}
                alt="bitswan logo"
                className="mx-auto transform duration-100 ease-in-out"
                width={25}
                height={25}
              />
            </Link>
          </div>
        </SidebarMenuButton>
      )}
    </>
  );
}