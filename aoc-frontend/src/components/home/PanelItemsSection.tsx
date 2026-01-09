import { DynamicIcon } from "../layout/Sidebar/DynamicIcon";
import PanelItemCard from "./PanelItemCard";
import React from "react";
import { useSidebarItems } from "@/context/SideBarItemsProvider";
import PanelItemFolder from "./PanelItemFolder";
import { type RawNavItem } from "../layout/Sidebar/utils/NavItems";
import { Button } from "../ui/button";
import { ArrowLeft } from "lucide-react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "../ui/breadcrumb";

export default function PanelItemsSection() {
  const { deserializedNavItems: sidebarItems } = useSidebarItems();
  const [isMounted, setIsMounted] = React.useState(false);
  // Store folder IDs instead of folder objects to avoid stale references
  const [folderPathIds, setFolderPathIds] = React.useState<number[]>([]);

  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  // Validate and fix folder path when sidebar items change
  React.useEffect(() => {
    if (folderPathIds.length === 0 || !sidebarItems) return;

    // Find a folder by ID in the sidebar items tree
    const findFolderById = (
      items: RawNavItem[],
      targetId: number
    ): RawNavItem | null => {
      for (const item of items) {
        if (item.id === targetId) {
          return item;
        }
        if (item.children) {
          const found = findFolderById(item.children, targetId);
          if (found) return found;
        }
      }
      return null;
    };

    // Check if all folders in the path still exist
    let currentItems = sidebarItems;
    let validPathLength = 0;
    
    for (const folderId of folderPathIds) {
      const folder = findFolderById(currentItems, folderId);
      if (!folder) {
        break;
      }
      validPathLength++;
      currentItems = folder.children ?? [];
    }

    // If path is invalid, reset to valid portion
    if (validPathLength < folderPathIds.length) {
      setFolderPathIds((prev) => prev.slice(0, validPathLength));
    }
  }, [sidebarItems, folderPathIds]);

  // Find a folder by ID in the sidebar items tree
  const findFolderById = (
    items: RawNavItem[],
    targetId: number
  ): RawNavItem | null => {
    for (const item of items) {
      if (item.id === targetId) {
        return item;
      }
      if (item.children) {
        const found = findFolderById(item.children, targetId);
        if (found) return found;
      }
    }
    return null;
  };

  // Get the current folder items based on the path
  const getCurrentFolderItems = (): RawNavItem[] => {
    if (folderPathIds.length === 0) {
      return sidebarItems ?? [];
    }
    
    // Find the current folder by traversing the path
    let currentItems = sidebarItems ?? [];
    for (const folderId of folderPathIds) {
      const folder = findFolderById(currentItems, folderId);
      if (!folder) {
        // If folder not found, return root items (path will be fixed by useEffect)
        return sidebarItems ?? [];
      }
      currentItems = folder.children ?? [];
    }
    
    return currentItems;
  };

  // Get folder objects for breadcrumbs
  const getFolderPath = (): RawNavItem[] => {
    const path: RawNavItem[] = [];
    let currentItems = sidebarItems ?? [];
    
    for (const folderId of folderPathIds) {
      const folder = findFolderById(currentItems, folderId);
      if (!folder) break;
      path.push(folder);
      currentItems = folder.children ?? [];
    }
    
    return path;
  };

  // Navigate to a folder
  const navigateToFolder = (folder: RawNavItem) => {
    setFolderPathIds((prev) => [...prev, folder.id]);
  };

  // Navigate back or to a specific folder in the path
  const navigateToPathIndex = (index: number) => {
    setFolderPathIds((prev) => prev.slice(0, index + 1));
  };

  // Navigate back one level
  const navigateBack = () => {
    setFolderPathIds((prev) => prev.slice(0, -1));
  };

  // Build breadcrumbs from the path
  const buildBreadcrumbs = (): Array<{ id: number; name: string }> => {
    const folderPath = getFolderPath();
    return folderPath.map((folder) => ({ id: folder.id, name: folder.name }));
  };

  if (!isMounted) {
    return null;
  }

  const currentItems = getCurrentFolderItems();
  const breadcrumbs = buildBreadcrumbs();
  const isInFolder = folderPathIds.length > 0;

  return (
    <div>
      {/* Breadcrumbs and Back Button */}
      {(isInFolder || breadcrumbs.length > 0) && (
        <div className="mb-4 flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={navigateBack}
            disabled={!isInFolder}
            className="h-8 w-8"
          >
            <ArrowLeft size={16} />
          </Button>
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink
                  onClick={() => setFolderPathIds([])}
                  className="cursor-pointer"
                >
                  Home
                </BreadcrumbLink>
              </BreadcrumbItem>
              {breadcrumbs.map((crumb, index) => (
                <React.Fragment key={crumb.id}>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    {index === breadcrumbs.length - 1 ? (
                      <BreadcrumbPage>{crumb.name}</BreadcrumbPage>
                    ) : (
                      <BreadcrumbLink
                        onClick={() => navigateToPathIndex(index)}
                        className="cursor-pointer"
                      >
                        {crumb.name}
                      </BreadcrumbLink>
                    )}
                  </BreadcrumbItem>
                </React.Fragment>
              ))}
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      )}

      {/* Items Grid */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {currentItems?.map((item) =>
          item.type === "folder" ? (
            <PanelItemFolder
              key={item.id + "folder"}
              title={item.name}
              items={item.children ?? []}
              onClick={() => navigateToFolder(item)}
            />
          ) : (
            <PanelItemCard
              key={item.id + "card"}
              icon={
                <DynamicIcon
                  name={item.icon}
                  size={24}
                  className="text-neutral-500"
                  title={item.icon}
                />
              }
              title={item.name}
              url={item.link}
            />
          )
        )}
      </div>
    </div>
  );
}