"use client";

import * as React from "react";

import { ChevronsUpDown, GalleryVerticalEnd, Loader2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { Button } from "../ui/button";
import { CreateOrgDialog } from "./create-org-dialog";
import { useAction } from "next-safe-action/hooks";
import { switchOrgAction } from "./actions";
import { toast } from "sonner";
import { type Organisation } from "@/data/organisations";

type OrgSwitcherProps = {
  orgs: Organisation[];
  activeOrg?: Organisation;
};

export function OrgSwitcher({
  orgs: orgs,
  activeOrg: activeOrg,
}: OrgSwitcherProps) {
  const { execute: switchOrg, isPending } = useAction(switchOrgAction, {
    onSuccess: () => {
      toast.success("Organization switched");
      // Force a full page refresh
      window.location.reload();
    },
    onError: ({ error }) => {
      toast.error(
        error?.serverError?.message ?? "Failed to switch organization",
      );
    },
  });

  const handleSwitchOrg = async (orgId: string) => {
    switchOrg({ orgId });
  };

  if (!activeOrg) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="min-w-[200px] bg-neutral-100">
          <div className="flex aspect-square size-6 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
            {isPending ? (
              <Loader2 className="size-3 animate-spin" />
            ) : (
              <GalleryVerticalEnd className="size-3" />
            )}
          </div>
          <div className="grid flex-1 text-left text-sm leading-tight">
            <span className="truncate font-medium">{activeOrg.name}</span>
          </div>
          <ChevronsUpDown className="ml-auto" />
        </Button>
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
              disabled={isPending}
              onClick={() => handleSwitchOrg(org.id)}
              className="gap-2 p-2"
            >
              <div className="flex size-6 items-center justify-center rounded-md border">
                <GalleryVerticalEnd className="size-3.5 shrink-0" />
              </div>
              {org.name}
            </DropdownMenuItem>
          );
        })}
        <DropdownMenuSeparator />

        <CreateOrgDialog />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
