import { Ungroup, Loader2 } from "lucide-react";import React from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { SidebarMenuButton } from "../ui/sidebar";
import { CaretSortIcon } from "@radix-ui/react-icons";
import { useSidebarItems } from "@/context/SideBarItemsProvider";
import { useAdminStatus } from "@/hooks/useAdminStatus";


export default function ProfileSelector() {
  const { isAdmin, isLoading } = useAdminStatus();

  const { activeProfile, setActiveProfile, profiles } = useSidebarItems();

  if (!isAdmin) {
    return <></>;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <SidebarMenuButton
            size="lg"
            className="mt-[10px] data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
        >
          <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
            {isLoading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Ungroup className="size-4" />
            )}
          </div>
          <div className="grid flex-1 text-left text-sm leading-tight">
            <span className="truncate font-semibold">{isLoading ? "Loading..." : activeProfile?.name}</span>
          </div>
          <CaretSortIcon className="ml-auto" />
        </SidebarMenuButton>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
        align="start"
        side={"bottom"}
        sideOffset={4}
      >
        <DropdownMenuLabel className="text-muted-foreground text-xs">
          Profiles
        </DropdownMenuLabel>
        {profiles?.length === 0 && (
          <div className="my-2 flex h-16 flex-col items-center justify-center gap-2 rounded border border-dashed">
            <div className="text-center text-xs font-normal text-neutral-500">
              No profiles found
            </div>
          </div>
        )}
        {profiles?.map((profile) => {
          return (
            <DropdownMenuItem
              key={profile.id}
              disabled={isLoading}
              onClick={() => {
                setActiveProfile(profile);
              }}
              className="gap-2 p-2"
            >
              {profile.name}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
