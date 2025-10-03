import {
  ChevronRight,
  MoreVertical,
  PenLine,
  Plus,
  Trash2,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../../../ui/dropdown-menu";
import {
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

import { CreateFolderFormDialog } from "./CreateFolderFormDialog";
import { CreateNavItemFormDialog } from "./CreateNavItemFormDialog";
import { type NavItem } from "../utils/NavItems";
import { type NodeModel } from "@minoru/react-dnd-treeview";
import React from "react";
import { useSidebarItems } from "@/context/SideBarItemsProvider";

export const CreateSidebarItem: React.FC = () => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <SidebarMenuItem className="list-none">
          <SidebarMenuButton>
            <Plus size={16} />
            <span className="my-auto">New shortcut</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        side="left"
        className="mt-8 w-[200px]"
      >
        <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
          <CreateFolderFormDialog />
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
          <CreateNavItemFormDialog />
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

type SidebarItemActionsProps = {
  type: string;
  parentId?: number;
  navItem: NodeModel<NavItem>;
};

export const SidebarItemActions: React.FC<SidebarItemActionsProps> = (
  props,
) => {
  const { sidebarItems, setSidebarItems } = useSidebarItems();

  const { type, parentId, navItem } = props;

  const [open, setOpen] = React.useState(false);

  const handleDeleteSidebarItem = () => {
    const updatedItems = sidebarItems.filter((item) => item.id !== navItem.id);
    setSidebarItems(updatedItems);
  };

  const editButton = (
    <button className="flex">
      <div>
        <PenLine size={16} className="mr-2" />
      </div>
      <div>Edit {type}</div>
    </button>
  );

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <SidebarMenuAction className="my-auto">
          <MoreVertical size={20} className="my-auto" />
        </SidebarMenuAction>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        side="right"
        className="mt-16 w-[200px]"
      >
        {type === "folder" && (
          <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
            <CreateInFolder parentId={parentId} />
          </DropdownMenuItem>
        )}
        <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
          {type === "folder" ? (
            <CreateFolderFormDialog
              parentId={parentId}
              trigger={editButton}
              navItem={navItem}
            />
          ) : (
            <CreateNavItemFormDialog
              parentId={parentId}
              trigger={editButton}
              navItem={navItem}
            />
          )}
        </DropdownMenuItem>
        <DropdownMenuItem>
          <button className="flex" onClick={handleDeleteSidebarItem}>
            <div>
              <Trash2 size={16} className="mr-2" />
            </div>
            <div>Delete {type}</div>
          </button>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

type CreateInFolderProps = {
  parentId?: number;
};

export const CreateInFolder: React.FC<CreateInFolderProps> = (props) => {
  const { parentId } = props;
  const [open, setOpen] = React.useState(false);

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <button className="flex w-full justify-between rounded text-sm  ">
          <div className="flex gap-2">
            <Plus size={16} className="   " />
            <span className="my-auto">Create in folder</span>
          </div>

          <ChevronRight size={16} />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        side="right"
        className="mt-8 w-[200px]"
      >
        <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
          <CreateFolderFormDialog parentId={parentId} />
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
          <CreateNavItemFormDialog parentId={parentId} />
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
