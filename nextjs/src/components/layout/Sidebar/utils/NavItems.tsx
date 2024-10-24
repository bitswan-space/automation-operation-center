"use client";

import { DynamicIcon } from "../DynamicIcon";
import { type NodeModel } from "@minoru/react-dnd-treeview";
import React from "react";

export type Nav = NavItem[];

export type RawNavItem = {
  parent: number | null;
  after: string | null;
  id: number;
  name: string;
  type: string;
  icon: string;
  link?: string;
  children?: RawNavItem[];
};

export interface NavItem {
  type: string;
  iconName?: string;
  icon?: React.ReactNode;
  href?: string;
  active?: boolean;
}

export const useSerializedNavItemData = (
  navItemData: RawNavItem[] = [],
): NodeModel<NavItem>[] => {
  // Recursive function to format nav items, including their children
  function formatNavItem(
    item: RawNavItem,
    parentId = 0,
    idCounter: { value: number },
  ): NodeModel<NavItem>[] {
    const currentId = idCounter.value++;
    const formattedItem: NodeModel<NavItem> = {
      id: currentId,
      parent: parentId,
      text: item.name,
      droppable: item.type === "folder",
      data: {
        type: item.type,
        iconName: item.icon,
        icon: (
          <DynamicIcon
            name={item.icon}
            size={24}
            className="text-neutral-500"
            title={item.icon}
          />
        ),
        href: item.link,
      },
    };

    const result: NodeModel<NavItem>[] = [formattedItem];

    if (item.children) {
      item.children.forEach((child: RawNavItem) => {
        result.push(...formatNavItem(child, currentId, idCounter));
      });
    }

    return result;
  }

  const navItems: NodeModel<NavItem>[] = React.useMemo(
    () => {
      const idCounter = { value: 1 };
      return navItemData.flatMap((item) => formatNavItem(item, 0, idCounter));
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [navItemData],
  );

  return navItems;
};

export const deserializeNavItems = (
  nodes: NodeModel<NavItem>[],
): RawNavItem[] => {
  // First, create a map of all items by their ID for easier lookup
  const itemsById = new Map(nodes.map((node) => [node.id, node]));

  // Create a map to store children for each parent
  const childrenByParent = new Map<number | string, number[]>();

  // Group children by their parent IDs
  nodes.forEach((node) => {
    const parentId = node.parent;
    if (!childrenByParent.has(parentId)) {
      childrenByParent.set(parentId, []);
    }
    childrenByParent.get(parentId)?.push(node.id as number);
  });

  // Recursive function to build the tree structure
  const buildTreeItem = (nodeId: number): RawNavItem => {
    const node = itemsById.get(nodeId);
    if (!node) {
      throw new Error(`Node with ID ${nodeId} not found`);
    }

    const children = childrenByParent.get(nodeId) ?? [];
    const result: RawNavItem = {
      id: nodeId,
      name: node.text,
      type: node.data?.type ?? "",
      icon: node.data?.iconName ?? "",
      parent: node.parent === 0 ? null : (node.parent as number),
      after: null, // This would need to be calculated based on the order if needed
      link: node.data?.href ?? "",
    };

    if (children.length > 0) {
      result.children = children.map((childId) => buildTreeItem(childId));
    }

    return result;
  };

  // Get root level items (those with parent = 0)
  const rootItems = childrenByParent.get(0) ?? [];

  // Build the final array of root items
  return rootItems.map((rootId) => buildTreeItem(rootId));
};

export const getLastId = (treeData: NodeModel[]) => {
  const reversedArray = [...treeData].sort((a, b) => {
    if (a.id < b.id) return 1;
    if (a.id > b.id) return -1;
    return 0;
  });

  return reversedArray.length > 0 ? reversedArray[0]?.id : 0;
};
