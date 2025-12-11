import { Network, Users, Loader2, Search } from "lucide-react";
import { Button } from "../ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "../ui/card";
import { Input } from "../ui/input";
import { useAutomations } from "@/context/AutomationsProvider";
import { Link } from "react-router-dom";
import { formatTimeAgo } from "@/utils/time";
import React, { useMemo, useEffect } from "react";
import { useWorkspacesQuery } from "@/hooks/useWorkspacesQuery";
import { Skeleton } from "../ui/skeleton";

type WorkspacesListSectionProps = {
  automationServerId?: string;
};

export function WorkspacesListSection(
  props: WorkspacesListSectionProps,
) {
  const { automationServerId } = props;
  const { isLoading, processes } = useAutomations();

  // Search state with debouncing
  const [searchQuery, setSearchQuery] = React.useState("");
  const [debouncedSearch, setDebouncedSearch] = React.useState("");

  // Debounce search input to avoid too many requests while typing
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const { data, hasNextPage, fetchNextPage, isFetching, isFetchingNextPage } = useWorkspacesQuery(debouncedSearch, automationServerId);

  // Flatten all pages into a single array
  const workspaces = useMemo(
    () => data?.pages.flatMap((page) => page.results) ?? [],
    [data],
  );

  const loadMoreRef = React.useRef<HTMLDivElement>(null);

  const getProcessCount = (workspaceId: string) => {
    if (!processes) return 0;
    return Object.values(processes).filter(
      (process) => process.workspace_id === workspaceId
    ).length;
  };

  React.useEffect(() => {
    const observerElement = loadMoreRef.current;
    if (!observerElement || !hasNextPage || isFetchingNextPage) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      {
        rootMargin: "100px", // Start loading slightly before the element is visible
      }
    );

    observer.observe(observerElement);

    return () => {
      if (observerElement) {
        observer.unobserve(observerElement);
      }
    };
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  return (
    <div className="mx-auto flex-1 px-0 py-4">
      <div className="mb-4 flex items-center justify-between">
        <div className="relative w-64">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            type="search"
            placeholder="Search workspaces..."
            className="border-gray-300 bg-white pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {!isFetching && workspaces.length === 0 ? (
        <div className="py-8 text-center text-gray-500">
          {automationServerId ? "No workspaces found for this server." : "No workspaces found"}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {workspaces.map((workspace) => (
            <Card key={workspace.id}>
              <CardHeader>
                <div>
                  <CardTitle className="text-lg font-semibold">
                    {workspace.name}
                  </CardTitle>
                  <div className="flex items-center gap-3 mt-3">
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Network size={16} />
                      <span>
                        {isLoading ? (
                          <Loader2 size={14} className="animate-spin inline-block" />
                        ) : (
                          getProcessCount(workspace.id)
                        )}{" "}
                        processes
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Users size={16} />
                      <span>0 users</span>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardFooter className="px-6 py-4 gap-3">
                <Link
                  to={`/workspaces/${workspace.id}`}
                  className="block"
                >
                  <Button variant="outline">
                    See processes
                  </Button>
                </Link>
                <span className="text-sm text-muted-foreground">
                  {formatTimeAgo(workspace.updated_at)}
                </span>
              </CardFooter>
            </Card>
          ))}
          {(hasNextPage || isFetching) && (
            <Card ref={loadMoreRef}>
              <CardContent className="p-0">
                <CardHeader>
                  <div>
                    <Skeleton className="h-6 w-32 mb-3" />
                    <div className="flex items-center gap-3 mt-3">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-4 w-20" />
                    </div>
                  </div>
                </CardHeader>
                <CardFooter className="px-6 py-4 gap-3">
                  <Skeleton className="h-10 w-32 rounded-md" />
                  <Skeleton className="h-4 w-20" />
                </CardFooter>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
