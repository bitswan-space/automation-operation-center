"use client";

import { LogOut, ChevronRight, Menu, Settings } from "lucide-react";
import { motion } from "framer-motion";
import Image from "next/image";

import { Button } from "../ui/button";
import clsx from "clsx";
import { signOut } from "next-auth/react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "../ui/sheet";
import React from "react";
import { SideBarContext } from "@/context/SideBarContextProvider";
import { Skeleton } from "../ui/skeleton";
import Link from "next/link";
import { handleError } from "@/utils/errors";
import { type DynamicSidebarItem } from "@/types/sidebar";
import { env } from "@/env.mjs";
import { useRouter } from "next/navigation";

const SideNavBar = () => {
  const [expanded, setExpanded] = React.useState<boolean>(false);

  const router = useRouter();

  const handleSignOut = () => {
    router.push("/api/keycloak-logout");
  };

  const handleExpand = () => {
    setExpanded(!expanded);
  };

  return (
    <div className="z-10 h-full min-h-max bg-neutral-800 py-6 text-slate-400">
      <button
        className="z-60 absolute -right-2 top-12 rounded-full bg-neutral-800 text-white shadow-lg"
        onClick={handleExpand}
      >
        <ChevronRight size={28} />
      </button>
      <div
        className={clsx("flex h-full flex-col justify-between", {
          "p-6": expanded,
        })}
      >
        <div className="flex flex-col justify-center gap-8">
          <Link href={"/"} className={"flex justify-center py-6 text-center"}>
            <Image
              src={
                expanded ? "/bitswan-logo-full.png" : "/bitswan-logo-sm.jpeg"
              }
              alt={""}
              width={expanded ? 150 : 25}
              height={expanded ? 100 : 25}
              className={clsx({
                "h-8 w-36": expanded,
                "w-5.5 h-7.5": !expanded,
              })}
            />
          </Link>
          <MenuItemList expanded={expanded} />
        </div>
        <div
          className={clsx({
            "p-4 px-0 pb-10": !expanded,
            "p-0": expanded,
          })}
        >
          <div className="mb-8 w-full space-y-4">
            <Link href={"/dashboard/settings"} className="w-full">
              <Button
                variant={"ghost"}
                size={"lg"}
                className={clsx("flex w-full gap-3 p-4 text-neutral-400", {
                  "justify-start": expanded,
                  "justify-center rounded-none": !expanded,
                })}
              >
                <Settings size={24} />
                {expanded && <span className="ml-2">Settings</span>}
              </Button>
            </Link>
            <Button
              variant={"ghost"}
              size={"lg"}
              className={clsx("flex w-full gap-3 p-4 text-neutral-400", {
                "justify-start": expanded,
                "justify-center rounded-none": !expanded,
              })}
              onClick={handleSignOut}
            >
              <LogOut size={24} />
              {expanded && <span className="ml-2">Sign out</span>}
            </Button>
          </div>
          <div className="px-2">
            <BuildTags expanded={expanded} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default SideNavBar;

export interface SideBarNavItemProps {
  iconURL?: string;
  title: string;
  active?: boolean;
  expanded?: boolean;
  hidden?: boolean;
  url: string;
  isExternal?: boolean;
  onClick?: () => void;
}

export function SideBarNavItem(props: Readonly<SideBarNavItemProps>) {
  const { title, active, expanded, hidden, url, isExternal, onClick, iconURL } =
    props;

  const variants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
  };

  return (
    <Link
      href={url}
      target={isExternal ? "_blank" : undefined}
      className="w-full"
      onClick={onClick}
    >
      <Button
        title={title}
        variant={"ghost"}
        size={expanded ? "lg" : "default"}
        className={clsx("group flex w-full gap-3 text-neutral-100", {
          "rounded-none border-l-4 border-blue-500 p-6 text-blue-500":
            active && !expanded,
          "ml-1 rounded-none p-6 text-neutral-50": !expanded && !active,
          "justify-start": expanded,
          "bg-blue-700 text-white": active && expanded,
          hidden: hidden,
        })}
      >
        <div
          className={clsx(
            "h-5 w-5 items-center justify-center bg-neutral-300 group-hover:bg-neutral-700",
          )}
          style={{
            WebkitMaskImage: `url(${iconURL})`,
            WebkitMaskRepeat: "no-repeat",
            WebkitMaskSize: "contain",
            maskImage: `url(${iconURL})`,
          }}
        ></div>

        {expanded && (
          <motion.div
            initial="hidden"
            animate={expanded ? "visible" : "hidden"}
            variants={variants}
            transition={{ duration: 0.8 }}
          >
            <span>{title}</span>
          </motion.div>
        )}
      </Button>
    </Link>
  );
}

export type MenuItemListProps = {
  expanded: boolean;
};

export function MenuItemList(props: Readonly<MenuItemListProps>) {
  const { expanded } = props;

  const sideBarItems = React.useContext(SideBarContext);
  const [activeItem, setActiveItem] = React.useState<string>(
    "Running automations",
  );

  const getURLFromType = (type: string, item: DynamicSidebarItem) => {
    switch (type) {
      case "external-link":
        return item.properties.link.href ?? "/";
      case "iframe-link":
        return `/iframe?iframeUrl=${item.properties.link.href}&title=${item.properties.name}`;
      default:
        return "/automations";
    }
  };

  return (
    <div className="flex flex-col justify-center gap-4 py-6">
      {sideBarItems?.map((item) => (
        <SideBarNavItem
          key={item.properties.name}
          iconURL={item.properties.icon.src}
          title={item.properties.name}
          active={
            item.properties.name === activeItem &&
            item.properties.link.type !== "external-link"
          }
          expanded={expanded}
          isExternal={item.properties.link.type === "external-link"}
          url={getURLFromType(item.properties.link.type, item)}
          onClick={() => setActiveItem(item.properties.name)}
        />
      ))}
      {sideBarItems?.length === 0 && (
        <div className="flex justify-center text-neutral-50">
          <Skeleton className="h-6 w-16" />
        </div>
      )}
    </div>
  );
}

export function MobileNavSheet() {
  const handleSignOut = () => {
    signOut({
      callbackUrl: "/login",
    })
      .then(() => {
        console.info("Signed out");
      })
      .catch((error: Error) => {
        handleError(error, "Failed to sign out");
      });
  };

  const expanded = true;

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Menu size={30} className="text-neutral-50" />
      </SheetTrigger>
      <SheetContent className="bg-neutral-800 text-neutral-50">
        <SheetHeader>
          <SheetTitle className="mx-auto">
            <Image
              height={40}
              width={140}
              className="h-8 w-36"
              src={"/bitswan-logo-full.png"}
              alt="logo"
            />
          </SheetTitle>
        </SheetHeader>
        <div className="flex h-full min-h-max flex-col justify-between bg-neutral-800 py-6 text-slate-400">
          <MenuItemList expanded />
          <div
            className={clsx("space-y-4", {
              "p-0": expanded,
            })}
          >
            <div>
              {" "}
              <Button
                variant={"ghost"}
                size={"lg"}
                className="flex w-full justify-start gap-3 rounded-none p-6 text-neutral-50 md:hidden lg:rounded-md"
                onClick={handleSignOut}
              >
                <LogOut size={20} />
                <span className="ml-2">Sign out</span>
              </Button>
            </div>

            <BuildTags expanded />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

export type BuildTagsProps = {
  expanded: boolean;
};

function BuildTags(props: Readonly<BuildTagsProps>) {
  const { expanded } = props;

  return (
    <div
      className={clsx(
        "flex w-full flex-col justify-center space-y-3 pl-6 font-mono text-[8px] md:pl-0",
      )}
    >
      <div
        className={clsx("space-y-0.5", {
          "flex gap-1 pl-2 md:justify-start": expanded,
        })}
      >
        <div className="font-bold">Commit Hash:</div>
        <div className="text-neutral-500 underline">
          #{env.NEXT_PUBLIC_COMMIT_HASH?.substring(0, 6)}
        </div>
      </div>
      <div
        className={clsx("space-y-0.5", {
          "flex gap-1 pl-2 md:justify-start": expanded,
        })}
      >
        <div className="font-bold">Build No:</div>
        <div className="text-neutral-500 underline">
          {env.NEXT_PUBLIC_BUILD_NO}
        </div>
      </div>
    </div>
  );
}
