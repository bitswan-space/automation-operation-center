"use client";

import { Ungroup, Loader2 } from "lucide-react";

import { ACTIVE_PROFILE_STORAGE_KEY } from "@/shared/constants";
import React, { useEffect, useState } from "react";
import useLocalStorageState from "ahooks/lib/useLocalStorageState";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { SidebarMenuButton } from "../ui/sidebar";
import { CaretSortIcon } from "@radix-ui/react-icons";
import { type Profile } from "@/data/profiles";
import { useSession } from "next-auth/react";
import { canMutateSidebarItems } from "@/lib/permissions";

type ProfileSelectorProps = {
  profiles?: Profile[];
};

export default function ProfileSelector(props: ProfileSelectorProps) {
  const { data: session } = useSession();
  const { profiles } = props;
  const [isClient, setIsClient] = useState(false);

  const [activeProfile, saveActiveProfile] = useLocalStorageState<
    Profile | undefined
  >(ACTIVE_PROFILE_STORAGE_KEY, {
    listenStorageChange: true,
    defaultValue: profiles?.[0],
  });

  // Prevent hydration mismatch by only rendering after client-side mount
  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!canMutateSidebarItems(session)) {
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
            {!isClient ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Ungroup className="size-4" />
            )}
          </div>
          <div className="grid flex-1 text-left text-sm leading-tight">
            <span className="truncate font-semibold">{!isClient ? "Loading..." : activeProfile?.name}</span>
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
              disabled={!isClient}
              onClick={() => {
                saveActiveProfile(profile);
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
