"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ChevronsUpDown, LogOut, Settings } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import Link from "next/link";
import { SidebarMenuButton } from "@/components/ui/sidebar";
import { handleError } from "@/utils/errors";
import { keyCloakSessionLogOut } from "@/utils/keycloak";
import { signOut } from "next-auth/react";

type SidebarFooterMenuProps = {
  name?: string | null;
  email?: string | null;
};
export const SidebarFooterMenu = (props: SidebarFooterMenuProps) => {
  const { name, email } = props;

  console.log("props", props);

  const handleSignOut = () => {
    keyCloakSessionLogOut()
      .then((_) => {
        signOut()
          .then((res) => console.info(res))
          .catch((error: Error) => {
            handleError(error, "Failed to sign out");
          });
      })
      .catch((error: Error) => {
        handleError(error, "Failed to end Keycloak session");
      });
  };

  const getInitials = (name: string) => {
    const [firstName, lastName] = name.split(" ");
    return `${firstName?.charAt(0) ?? ""}${lastName?.charAt(0) ?? ""}`;
  };
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <SidebarMenuButton
          size="lg"
          className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
        >
          <Avatar className="h-8 w-8 rounded-lg">
            <AvatarImage src={"#"} alt={"Mike Farad"} />
            <AvatarFallback className="rounded-lg">
              {getInitials(name ?? "")}
            </AvatarFallback>
          </Avatar>
          <div className="grid flex-1 text-left text-sm leading-tight">
            <span className="truncate font-semibold">{name}</span>
            <span className="truncate text-xs">{email}</span>
          </div>
          <ChevronsUpDown className="ml-auto size-4" />
        </SidebarMenuButton>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
        side="bottom"
        align="end"
        sideOffset={4}
      >
        <DropdownMenuLabel className="p-0 font-normal">
          <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
            <Avatar className="h-8 w-8 rounded-lg">
              <AvatarImage src={"#"} alt={"Mike Farad"} />
              <AvatarFallback className="rounded-lg">
                {getInitials(name ?? "")}
              </AvatarFallback>
            </Avatar>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-semibold">{name}</span>
              <span className="truncate text-xs">{email}</span>
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup className="text-sm">
          <Link href={"/dashboard/settings"}>
            <DropdownMenuItem className="text-sm">
              <Settings size={16} className="mr-2" />
              Settings
            </DropdownMenuItem>
          </Link>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut}>
          <LogOut size={16} className="mr-2" />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
