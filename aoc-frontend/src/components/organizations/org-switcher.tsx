"use client";

import * as React from "react";

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
import { type Organisation } from "@/data/organisations";
import { SidebarMenuButton } from "../ui/sidebar";
import { CaretSortIcon } from "@radix-ui/react-icons";

type OrgSwitcherProps = {
  orgs: Organisation[];
  activeOrg?: Organisation;
};

export function OrgSwitcher({
  orgs: orgs,
  activeOrg: activeOrg,
}: OrgSwitcherProps) {
  console.log("OrgSwitcher render - orgs:", orgs.length, "activeOrg:", activeOrg?.name);
  
  const [createOrgDialogOpen, setCreateOrgDialogOpen] = React.useState(false);
  
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
        className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
        align="start"
        side={"bottom"}
        sideOffset={4}
      >
        <DropdownMenuLabel className="text-muted-foreground text-xs">
          Organizations
        </DropdownMenuLabel>
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
        <DropdownMenuSeparator />

        <CreateOrgDialogTrigger onTriggerClick={handleCreateOrgClick} />
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
