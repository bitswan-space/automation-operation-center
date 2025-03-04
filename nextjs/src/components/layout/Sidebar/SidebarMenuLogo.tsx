"use client";

import { SidebarMenuButton, useSidebar } from "@/components/ui/sidebar";

import Image from "next/image";
import Link from "next/link";

export function SidebarMenuLogo() {
  const { open } = useSidebar();
  return (
    <>
      {open && (
        <SidebarMenuButton
          size="lg"
          className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
        >
          <div className="flex items-center justify-center rounded-lg data-[state=open]:block">
            <Link
              href={"/dashboard"}
              className={"flex justify-center text-center"}
            >
              <Image
                src={"/bitswan-logo.svg"}
                alt="bitswan logo"
                className="mr-auto transform duration-100 ease-in-out"
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
          <div className="mx-auto flex items-center justify-center rounded-lg">
            <Link
              href={"/dashboard"}
              className={"mx-auto flex justify-center text-center"}
            >
              <Image
                src={"/bitswan-logo-sm.svg"}
                alt="bitswan logo"
                className="mr-auto transform duration-100 ease-in-out"
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
