import type { MutableRefObject } from "react";
import type { UniqueIdentifier } from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";

export type TreeItem<K> = {
  id: UniqueIdentifier;
  children?: TreeItem<K>[];
  collapsed?: boolean;
} & K;

export type TreeItems<K> = TreeItem<K>[];

export type FlattenedItem<K> = TreeItem<K> & {
  parentId: UniqueIdentifier | null;
  depth: number;
  index: number;
};

export type SensorContext<K> = MutableRefObject<{
  items: FlattenedItem<K>[];
  offset: number;
}>;

export function getProjection<K>(
  items: FlattenedItem<K>[],
  activeId: UniqueIdentifier,
  overId: UniqueIdentifier,
  dragOffset: number,
  indentationWidth: number,
) {
  const overItemIndex = items.findIndex(({ id }) => id === overId);
  const activeItemIndex = items.findIndex(({ id }) => id === activeId);
  const activeItem = items[activeItemIndex];
  const newItems = arrayMove(items, activeItemIndex, overItemIndex);
  const previousItem = newItems[overItemIndex - 1];
  const nextItem = newItems[overItemIndex + 1];
  const dragDepth = Math.round(dragOffset / indentationWidth);
  const projectedDepth = (activeItem?.depth ?? 0) + dragDepth;
  const maxDepth = getMaxDepth({ previousItem });
  const minDepth = getMinDepth({ nextItem });
  const depth = Math.min(Math.max(projectedDepth, minDepth), maxDepth);

  const parentId = getParentId();

  return { depth, maxDepth, minDepth, parentId };

  function getParentId() {
    if (depth === 0 || !previousItem) {
      return null;
    }

    if (depth === previousItem.depth) {
      return previousItem.parentId;
    }

    if (depth > previousItem.depth) {
      return previousItem.id;
    }

    const newParent = newItems
      .slice(0, overItemIndex)
      .reverse()
      .find((item) => item.depth === depth)?.parentId;

    return newParent ?? null;
  }
}

function getMaxDepth<K>({ previousItem }: { previousItem?: FlattenedItem<K> }) {
  return previousItem ? previousItem.depth + 1 : 0;
}

function getMinDepth<K>({ nextItem }: { nextItem?: FlattenedItem<K> }) {
  return nextItem ? nextItem.depth : 0;
}

export function removeItem<K>(items: TreeItems<K>, id: UniqueIdentifier) {
  const newItems = [];

  for (const item of items) {
    if (item.id === id) {
      continue;
    }

    if (item.children?.length) {
      item.children = removeItem(item.children, id);
    }

    newItems.push(item);
  }

  return newItems;
}

export function setProperty<T extends keyof TreeItem<K>, K>(
  items: TreeItems<K>,
  id: UniqueIdentifier,
  property: T,
  setter: (value: TreeItem<K>[T]) => TreeItem<K>[T],
) {
  for (const item of items) {
    if (item.id === id) {
      item[property] = setter(item[property]);
      continue;
    }

    if (item.children?.length) {
      item.children = setProperty(item.children, id, property, setter);
    }
  }

  return [...items];
}

function flatten<K>(
  items: TreeItems<K>,
  parentId: UniqueIdentifier | null = null,
  depth = 0,
): FlattenedItem<K>[] {
  return items.reduce<FlattenedItem<K>[]>((acc, item, index) => {
    return [
      ...acc,
      { ...item, parentId, depth, index },
      ...flatten(item.children ?? [], item.id, depth + 1),
    ];
  }, []);
}

export function flattenTree<K>(items: TreeItems<K>): FlattenedItem<K>[] {
  return flatten(items);
}

export function removeChildrenOf<K>(
  items: FlattenedItem<K>[],
  ids: UniqueIdentifier[],
) {
  const excludeParentIds = [...ids];

  return items.filter((item) => {
    if (item.parentId && excludeParentIds.includes(item.parentId)) {
      if (item.children?.length) {
        excludeParentIds.push(item.id);
      }
      return false;
    }

    return true;
  });
}

export function buildTree<K>(
  flattenedItems: FlattenedItem<K>[],
): TreeItems<K> | undefined {
  const root: TreeItem<K> = {
    id: "root" as UniqueIdentifier,
    children: [],
  } as TreeItem<K>;
  const nodes: Record<string, TreeItem<K>> = { [root.id]: root };
  const items = flattenedItems.map((item) => ({ ...item, children: [] }));

  for (const item of items) {
    const { id, children } = item;
    const parentId = item.parentId ?? root.id;
    const parent = nodes[parentId] ?? findItem(items, parentId);

    nodes[id] = { ...item, children: [] };
    parent?.children?.push(item);
  }

  return root.children;
}

export function findItem<K>(items: TreeItem<K>[], itemId: UniqueIdentifier) {
  return items.find(({ id }) => id === itemId);
}

export function findItemDeep<K>(
  items: TreeItems<K>,
  itemId: UniqueIdentifier,
): TreeItem<K> | undefined {
  for (const item of items) {
    const { id, children } = item;

    if (id === itemId) {
      return item;
    }

    if (children?.length) {
      const child = findItemDeep(children, itemId);

      if (child) {
        return child;
      }
    }
  }

  return undefined;
}

function countChildren<K>(items: TreeItem<K>[], count = 0): number {
  return items.reduce((acc, { children }) => {
    if (children?.length) {
      return countChildren(children, acc + 1);
    }

    return acc + 1;
  }, count);
}

export function getChildCount<K>(items: TreeItems<K>, id: UniqueIdentifier) {
  const item = findItemDeep(items, id);

  return item ? countChildren(item.children ?? []) : 0;
}
