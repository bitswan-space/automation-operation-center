import {
  LogOut,
  type LucideIcon,
  RefreshCcw,
  ChevronRight,
  Menu,
  BrainCircuit,
  ArrowUpRightSquare,
} from "lucide-react";
import { motion } from "framer-motion";
import Image from "next/image";

import { Button } from "../ui/button";
import clsx from "clsx";
import { signOut } from "next-auth/react";
import { SiApachekafka } from "react-icons/si";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "../ui/sheet";
import React from "react";
import { SideBarContext } from "@/context/sideBarContext";
import { Skeleton } from "../ui/skeleton";
import Link from "next/link";
import { type IconType } from "react-icons";
import { handleError } from "@/utils/errors";

interface SideNavBarProps {
  expanded: boolean;
  onExpand: () => void;
}

const SideNavBar = (props: SideNavBarProps) => {
  const { expanded, onExpand } = props;

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

  const handleExpand = () => {
    onExpand();
  };

  return (
    <div className="relative h-full min-h-max bg-neutral-800 py-6 text-slate-400">
      <div
        className="absolute -right-2 top-12 rounded-full bg-neutral-800 text-white shadow-lg"
        onClick={handleExpand}
      >
        <ChevronRight size={28} />
      </div>
      <div
        className={clsx("flex h-full flex-col justify-between", {
          "p-6": expanded,
        })}
      >
        <div className="flex flex-col justify-center gap-8">
          <div className={"flex justify-center py-6 text-center"}>
            <Image
              src={
                expanded ? "/bitswan-logo-full.png" : "/bitswan-logo-sm.jpeg"
              }
              alt={""}
              width={expanded ? 150 : 25}
              height={expanded ? 100 : 25}
              className={clsx({
                "h-8 w-36": expanded,
                "h-7 w-5": !expanded,
              })}
            />
          </div>
          <MenuItemList expanded={expanded} />
        </div>
        <div className="p-6 pb-16 md:hidden">
          <Button
            variant={"ghost"}
            size={"lg"}
            className="flex w-full justify-start gap-3 rounded-none p-6 text-neutral-50 lg:rounded-md"
            onClick={handleSignOut}
          >
            <LogOut size={22} />
            {expanded && <span className="ml-2">Sign out</span>}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SideNavBar;

export interface SideBarNavItemProps {
  Icon: LucideIcon | IconType;
  title: string;
  active?: boolean;
  expanded?: boolean;
  hidden?: boolean;
  url?: string;
  isExternal?: boolean;
}

export function SideBarNavItem(props: SideBarNavItemProps) {
  const { Icon, title, active, expanded, hidden, url, isExternal } = props;

  const variants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
  };

  return (
    <Link
      href={url ?? "/"}
      target={isExternal ? "_blank" : undefined}
      className="w-full"
    >
      <Button
        title={title}
        variant={"ghost"}
        size={expanded ? "lg" : "default"}
        className={clsx("flex w-full gap-3 text-neutral-100", {
          "rounded-none border-l-4 border-blue-500 p-6 text-blue-500":
            active && !expanded,
          "ml-1 rounded-none p-6 text-neutral-50": !expanded && !active,
          "justify-start": expanded,
          "bg-blue-700 text-white hover:bg-blue-600 hover:text-white":
            active && expanded,
          "hidden ": hidden,
        })}
      >
        <Icon size={22} />
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

export function MenuItemList(props: MenuItemListProps) {
  const { expanded } = props;

  const sideBarItems = React.useContext(SideBarContext);

  // todo: add machine readable attributes to the sidebar items
  const getIconFromType = (type: string) => {
    switch (type) {
      case "Running pipelines":
        return RefreshCcw;
      case "ML Ops":
        return BrainCircuit;
      case "Kafka":
        return SiApachekafka;
      default:
        return ArrowUpRightSquare;
    }
  };

  return (
    <div className="flex flex-col justify-center gap-4 py-6">
      {sideBarItems?.map((item, idx) => (
        <SideBarNavItem
          key={idx}
          Icon={getIconFromType(item.properties.name)}
          title={item.properties.name}
          // todo: this is hardcoded it will be easier to use the machine readable attributes
          active={item.properties.name === "Running pipelines"}
          expanded={expanded}
          isExternal={item.properties.link.type === "external-link"}
          url={item.properties.link.href ?? "/"}
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
        <div>
          <MenuItemList expanded={true} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
