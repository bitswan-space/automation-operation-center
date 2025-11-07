import { Ungroup, Loader2 } from "lucide-react";
import React, { useRef, useCallback } from "react";
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
import { useProfilesQuery } from "@/hooks/useProfilesQuery";


export default function ProfileSelector() {
  const { isAdmin, isLoading } = useAdminStatus();
  const { activeProfile, setActiveProfile, profiles } = useSidebarItems();
  const { fetchNextPage, hasNextPage, isFetchingNextPage } = useProfilesQuery();
  const contentRef = useRef<HTMLDivElement>(null);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    const scrollTop = target.scrollTop;
    const scrollHeight = target.scrollHeight;
    const clientHeight = target.clientHeight;
    
    // Load more when scrolled within 50px of the bottom
    const scrollBottom = scrollHeight - scrollTop - clientHeight;
    if (scrollBottom < 50 && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

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
        ref={contentRef}
        onScroll={handleScroll}
        className="w-(--radix-dropdown-menu-trigger-width) min-w-56 max-h-80 rounded-lg"
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
        {isFetchingNextPage && (
          <div className="flex items-center justify-center py-2">
            <Loader2 className="size-4 animate-spin text-muted-foreground" />
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
