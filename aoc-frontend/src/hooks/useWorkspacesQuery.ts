import { useAuth } from "@/context/AuthContext";
import { getWorkspaces, getWorkspaceById } from "@/data/workspaces";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";

export const WORKSAPCES_QUERY_KEY = ["workspaces"];

export function useWorkspacesQuery(search?: string) {
  const { isAuthenticated } = useAuth();

  return useInfiniteQuery({
    queryKey: [...WORKSAPCES_QUERY_KEY, search || ""],
    queryFn: ({ pageParam = 1 }) => getWorkspaces(pageParam, search),
    getNextPageParam: (lastPage) => {
      // If there's a next URL, extract the page number from it
      if (lastPage.next) {
        try {
          const url = new URL(lastPage.next);
          const page = url.searchParams.get("page");
          return page ? parseInt(page, 10) : undefined;
        } catch (error) {
          console.error("Error parsing next URL:", error);
          return undefined;
        }
      }
      return undefined;
    },
    initialPageParam: 1,
    enabled: isAuthenticated, // Only fetch when user is authenticated
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  });
}

export function useWorkspaceByIdQuery(workspaceId: string) {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: [...WORKSAPCES_QUERY_KEY, workspaceId],
    queryFn: () => getWorkspaceById(workspaceId),
    enabled: isAuthenticated, // Only fetch when user is authenticated
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  });
}


