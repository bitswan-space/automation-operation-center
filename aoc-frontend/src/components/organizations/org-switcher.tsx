"use client";

import * as React from "react";
import { useRef, useCallback, useMemo } from "react";

import { GalleryVerticalEnd, Loader2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { CreateOrgDialog, CreateOrgDialogTrigger } from "./create-org-dialog";
import { useAction } from "@/hooks/useAction";
import { switchOrgAction } from "./actions";
import { toast } from "sonner";
import { SidebarMenuButton } from "../ui/sidebar";
import { CaretSortIcon } from "@radix-ui/react-icons";
import { useOrgs } from "@/context/OrgsProvider";
import { useOrgsQuery } from "@/hooks/useOrgsQuery";


export function OrgSwitcher() {
  const { activeOrg } = useOrgs();
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useOrgsQuery();
  const contentRef = useRef<HTMLDivElement>(null);
  
  console.log("OrgSwitcher render - activeOrg:", activeOrg?.name);
  
  const [createOrgDialogOpen, setCreateOrgDialogOpen] = React.useState(false);
  
  // Flatten all pages from the infinite query into a single array
  const orgs = useMemo(() => {
    if (!data?.pages) {
      return [];
    }
    return data.pages.flatMap((page) => {
      // Handle both success and error responses
      if (page.status === "success") {
        return page.results ?? [];
      }
      return [];
    });
  }, [data]);

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
  
  const { execute: switchOrg, isPending } = useAction(switchOrgAction, {
    onSuccess: () => {
      console.log("OrgSwitcher - switchOrg onSuccess called");
      toast.success("Organization switched");
      // Force a full page refresh
      window.location.reload();
    },
    onError: ({ error }) => {
      console.log("OrgSwitcher - switchOrg onError called:", error);
      toast.error(
        error?.serverError?.message ?? "Failed to switch organization",
      );
    },
  });

  const handleSwitchOrg = async (orgId: string) => {
    console.log("OrgSwitcher - handleSwitchOrg called with orgId:", orgId);
    switchOrg({ orgId });
  };

  const handleCreateOrgClick = () => {
    console.log("OrgSwitcher - handleCreateOrgClick called, setting dialog open to true");
    setCreateOrgDialogOpen(true);
  };

  if (!activeOrg) {
    return null;
  }

  return (
    <>
      <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <SidebarMenuButton 
          size="lg"
          className="mt-[10px] data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
        >
          <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
            {isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <GalleryVerticalEnd className="size-4" />
            )}
          </div>
          <div className="grid flex-1 text-left text-sm leading-tight">
            <span className="truncate font-semibold">{activeOrg.name}</span>
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
          Organizations
        </DropdownMenuLabel>
        <CreateOrgDialogTrigger onTriggerClick={handleCreateOrgClick} />
        <DropdownMenuSeparator />
        {orgs.length === 0 && (
          <div className="my-2 flex h-16 flex-col items-center justify-center gap-2 rounded border border-dashed">
            <div className="text-center text-xs font-normal text-neutral-500">
              No organizations found
            </div>
          </div>
        )}
        {orgs.map((org) => {
          return (
            <DropdownMenuItem
              key={org.id}
              {...(isPending ? { disabled: true } : {})}
              onClick={() => handleSwitchOrg(org.id)}
              className="gap-2 p-2"
            >
              <div className="flex size-6 items-center justify-center rounded-sm border">
                <GalleryVerticalEnd className="size-4 shrink-0" />
              </div>
              {org.name}
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
    
      {/* Dialog rendered outside of dropdown menu */}
      <CreateOrgDialog 
        open={createOrgDialogOpen}
        onOpenChange={setCreateOrgDialogOpen}
      />
    </>
  );
}
