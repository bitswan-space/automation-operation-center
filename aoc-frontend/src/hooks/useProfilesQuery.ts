import { useInfiniteQuery } from "@tanstack/react-query";
import { fetchProfiles } from "@/data/profiles";
import { useAuth } from "@/context/AuthContext";

export const PROFILES_QUERY_KEY = ["profiles"];

export function useProfilesQuery() {
  const { isAuthenticated } = useAuth();
  
  return useInfiniteQuery({
    queryKey: PROFILES_QUERY_KEY,
    queryFn: ({ pageParam = 1 }) => fetchProfiles({ pageParam }),
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
