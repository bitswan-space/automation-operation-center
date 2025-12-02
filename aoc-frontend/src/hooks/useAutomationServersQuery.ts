import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import {
  createAutomationServerWithOTP,
  deleteAutomationServer,
  getAutomationServers,
} from "@/data/automation-server";

export const AUTOMATION_SERVERS_QUERY_KEY = ["automation-servers"];

export function useAutomationServersQuery(search?: string) {
  const { isAuthenticated } = useAuth();

  return useInfiniteQuery({
    queryKey: [...AUTOMATION_SERVERS_QUERY_KEY, search || ""],
    queryFn: ({ pageParam = 1 }) => getAutomationServers(pageParam, search),
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

export function useCreateAutomationServer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (name: string) => createAutomationServerWithOTP(name),
    onSuccess: () => {
      // Invalidate automation servers when automation server is created successfully
      queryClient.invalidateQueries({ queryKey: AUTOMATION_SERVERS_QUERY_KEY });
    },
  });
}

export function useDeleteAutomationServer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (serverId: string) => deleteAutomationServer(serverId),
    onSuccess: () => {
      // Invalidate automation servers when automation server is deleted successfully
      queryClient.invalidateQueries({ queryKey: AUTOMATION_SERVERS_QUERY_KEY });
    },
  });
}
