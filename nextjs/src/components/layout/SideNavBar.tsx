import {
  LogOut,
  type LucideIcon,
  RefreshCcw,
  PencilLine,
  PieChart,
  Braces,
  ShoppingCart,
  Router,
  ChevronRight,
  Settings,
  Menu,
} from "lucide-react";
import { motion } from "framer-motion";
import Image from "next/image";

import { Button } from "../ui/button";
import clsx from "clsx";
import { signOut } from "next-auth/react";
import { useRouter } from "next/router";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "../ui/sheet";

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
        console.log("Signed out");
      })
      .catch((error) => {
        console.error(error);
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
              className={clsx({ "h-8 w-36": expanded })}
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
  Icon: LucideIcon;
  title: string;
  active?: boolean;
  expanded?: boolean;
  hidden?: boolean;
  url?: string;
}

export function SideBarNavItem(props: SideBarNavItemProps) {
  const { Icon, title, active, expanded, hidden, url } = props;

  const router = useRouter();

  const variants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
  };

  const handleOnClick = () => {
    router
      .push(url ?? "/")
      .then(() => {
        console.log("Navigated to ", url);
      })
      .catch((error) => {
        console.error(error);
      });
  };

  return (
    <Button
      title={title}
      variant={"ghost"}
      size={expanded ? "lg" : "default"}
      className={clsx("flex gap-3 text-neutral-100", {
        "rounded-none border-l-4 border-blue-500 p-6 text-blue-500":
          active && !expanded,
        "rounded-none p-6 text-neutral-50": !expanded && !active,
        "justify-start": expanded,
        "bg-blue-700 text-white hover:bg-blue-600 hover:text-white":
          active && expanded,
        "hidden ": hidden,
      })}
      onClick={handleOnClick}
    >
      <Icon size={20} strokeWidth={2.3} />
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
  );
}

export type MenuItemListProps = {
  expanded: boolean;
};

export function MenuItemList(props: MenuItemListProps) {
  const { expanded } = props;
  return (
    <div className="flex flex-col justify-center gap-4 py-6">
      <SideBarNavItem
        Icon={RefreshCcw}
        title="Running Pipelines"
        active
        expanded={expanded}
        url="/"
      />
      <SideBarNavItem
        Icon={PencilLine}
        title="Pipelines builder"
        expanded={expanded}
        hidden
      />
      <SideBarNavItem
        Icon={PieChart}
        title="View Data"
        expanded={expanded}
        hidden
      />
      <SideBarNavItem
        Icon={Braces}
        title="Data Studio"
        expanded={expanded}
        hidden
      />
      <SideBarNavItem
        Icon={ShoppingCart}
        title="Store"
        expanded={expanded}
        hidden
      />
      <SideBarNavItem
        Icon={Router}
        title="Data Providers"
        expanded={expanded}
        hidden
      />
      <SideBarNavItem
        Icon={Settings}
        title="Settings"
        expanded={expanded}
        hidden
      />
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
          <MenuItemList expanded={true} />
        </SheetHeader>
      </SheetContent>
    </Sheet>
  );
}
