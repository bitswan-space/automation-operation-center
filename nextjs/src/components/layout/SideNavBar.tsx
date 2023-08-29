import {
  LogOut,
  type LucideIcon,
  RefreshCcw,
  PencilLine,
  PieChart,
  Braces,
  ShoppingCart,
  Router,
} from "lucide-react";

import { Button } from "../ui/button";
import clsx from "clsx";
import { signOut } from "next-auth/react";

const SideNavBar = () => {
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

  return (
    <div className="h-full min-h-max bg-stone-900 py-4 text-slate-400">
      <div className="flex h-full flex-col justify-between">
        <div className="flex flex-col gap-6">
          <SideBarNavItem Icon={RefreshCcw} title="Home" active />
          <SideBarNavItem Icon={PencilLine} title="Schedule" />
          <SideBarNavItem Icon={PieChart} title="Settings" />
          <SideBarNavItem Icon={Braces} title="Settings" />
          <SideBarNavItem Icon={ShoppingCart} title="Settings" />
          <SideBarNavItem Icon={PieChart} title="Settings" />
          <SideBarNavItem Icon={Router} title="Settings" />
        </div>
        <div className="pb-20">
          <Button
            variant={"ghost"}
            className="rounded-none"
            onClick={handleSignOut}
          >
            <LogOut size={22} />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SideNavBar;

interface SideBarNavItemProps {
  Icon: LucideIcon;
  title: string;
  active?: boolean;
}

function SideBarNavItem(props: SideBarNavItemProps) {
  const { Icon, title, active } = props;

  return (
    <Button
      title={title}
      variant={"ghost"}
      size={"sm"}
      className={clsx("flex items-center gap-2 rounded-none", {
        "border-l-4 border-blue-500 text-blue-500": active,
      })}
    >
      <Icon size={20} strokeWidth={2.3} />
    </Button>
  );
}
