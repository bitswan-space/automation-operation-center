import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createOrg, fetchOrgs } from "@/data/organisations";
import { useAuth } from "@/context/AuthContext";

export const ORGS_QUERY_KEY = ["orgs"];

export function useOrgsQuery() {
  const { isAuthenticated } = useAuth();
  
  return useInfiniteQuery({
    queryKey: ORGS_QUERY_KEY,
    queryFn: ({ pageParam = 1 }) => fetchOrgs({ pageParam }),
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

export function useCreateOrg() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ name }: { name: string }) => createOrg(name),
    onSuccess: () => {
      // Invalidate orgs when org is created successfully
      queryClient.invalidateQueries({ queryKey: ORGS_QUERY_KEY });
    },
  });
}
