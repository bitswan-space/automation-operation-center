"use client";

import { ChevronRight, GripVertical } from "lucide-react";
import {
  type DropOptions,
  MultiBackend,
  type NodeModel,
  Tree,
  getBackendOptions,
} from "@minoru/react-dnd-treeview";
import { DndProvider } from "react-dnd";
import { type NavItem } from "./utils/NavItems";
import React from "react";
import {
  CreateSidebarItem,
  SidebarItemActions,
} from "./forms/CreateSidebarItemDropDown";
import clsx from "clsx";
import {
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { useSidebarItems } from "@/context/SideBarItemsProvider";
import Link from "next/link";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function NavTreeView() {
  const { sidebarItems, setSidebarItems } = useSidebarItems();

  const { editMode } = useSidebar();

  const [isMounted, setIsMounted] = React.useState(false);

  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return null;
  }

  const handleDrop = (
    newTree: NodeModel<NavItem>[],
    options: DropOptions<NavItem>,
  ) => {
    const { dragSourceId, dropTargetId } = options;

    if (dragSourceId === undefined) return;

    const updatedTree = newTree.map((node) => {
      if (node.id === dragSourceId) {
        return {
          ...node,
          parent: dropTargetId ?? 0, // Set to root (0) if dropTargetId is null/undefined
        };
      }
      return node;
    });

    setSidebarItems(updatedTree);
  };

  return (
    <div className="flex flex-col gap-4">
      {editMode && <CreateSidebarItem />}
      <DndProvider backend={MultiBackend} options={getBackendOptions()}>
        <Tree
          tree={sidebarItems}
          rootId={0}
          onDrop={handleDrop}
          canDrop={(tree, options) => {
            const { dragSource, dropTarget } = options;

            if (!editMode) return false;

            if (!dragSource) return false;

            // Allow root drops when dropTarget is undefined/null
            if (!dropTarget) return true;

            // If we have a dropTarget, it must be a folder
            if (!dropTarget.droppable) return false;

            // Prevent dropping parent into its own children
            if (dragSource.id === dropTarget.id) return false;

            // Check if dropTarget is a child of dragSource
            const isChild = (
              parent: NodeModel<NavItem>,
              child: NodeModel<NavItem>,
            ): boolean => {
              if (parent.id === child.parent) return true;
              const parentNode = tree.find((node) => node.id === child.parent);
              return parentNode ? isChild(parent, parentNode) : false;
            };

            return !isChild(dragSource, dropTarget);
          }}
          canDrag={() => {
            if (!editMode) return false;

            return true;
          }}
          classes={{
            root: "gap-2",
            draggingSource: "opacity-30",
            dropTarget: "bg-neutral-700/50 rounded",
          }}
          sort={false}
          insertDroppableFirst={false}
          dropTargetOffset={5}
          placeholderRender={(node, { depth }) => (
            <div
              className="my-1 rounded border border-blue-600"
              style={{ marginLeft: depth * 24 }}
            />
          )}
          render={(node, { depth, isOpen, onToggle }) => (
            <SideNavTreeItem
              node={node}
              depth={depth}
              isOpen={isOpen}
              onToggle={onToggle}
            />
          )}
        />
      </DndProvider>
    </div>
  );
}

type SideNavTreeItemProps = {
  node: NodeModel<NavItem>;
  depth: number;
  isOpen: boolean;
  onToggle?: () => void;
};

export const SideNavTreeItem = (props: SideNavTreeItemProps) => {
  const { node, depth, onToggle, isOpen } = props;

  const { open, editMode } = useSidebar();

  const getMarginLeft = () => (open ? depth * 10 : 0);

  const getLinkHref = () => {
    if (node.data?.type === "external-link") {
      return node.data?.href ?? "#";
    }
    return "#";
  };

  if (!node.droppable) {
    return (
      <SidebarMenuItem
        className={clsx(`justify-between`)}
        style={{
          marginInlineStart: getMarginLeft(),
        }}
      >
        <Link href={getLinkHref()} target="_blank" rel="noopener noreferrer">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <SidebarMenuButton title={node.text}>
                  {editMode && open && (
                    <div className="my-auto cursor-grab">
                      <GripVertical
                        size={16}
                        className="my-auto text-neutral-500"
                      />
                    </div>
                  )}
                  {node.data?.icon}
                  {node.text}
                </SidebarMenuButton>
              </TooltipTrigger>
              {!open && (
                <TooltipContent side="right">
                  <p>{node.text}</p>
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>
        </Link>
        {editMode && (
          <SidebarItemActions
            type={node.data?.type ?? ""}
            parentId={node.id as number}
            navItem={node}
          />
        )}
      </SidebarMenuItem>
    );
  }

  return (
    <SidebarMenuItem
      className={clsx(`justify-between`)}
      style={{
        marginInlineStart: getMarginLeft(),
      }}
    >
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <SidebarMenuButton>
              {editMode && open && (
                <div className="my-auto cursor-grab">
                  <GripVertical
                    size={16}
                    className="my-auto text-neutral-500"
                  />
                </div>
              )}
              <ChevronRight
                size={24}
                onClick={onToggle}
                className={clsx(
                  "duration-250 transition-transform",
                  isOpen && "rotate-[90deg]",
                )}
              />
              {node.text}
            </SidebarMenuButton>
          </TooltipTrigger>
          {!open && (
            <TooltipContent side="right">
              <p>{node.text}</p>
            </TooltipContent>
          )}
        </Tooltip>
      </TooltipProvider>
      {editMode && (
        <SidebarItemActions
          type={node.data?.type ?? ""}
          parentId={node.id as number}
          navItem={node}
        />
      )}
    </SidebarMenuItem>
  );
};
