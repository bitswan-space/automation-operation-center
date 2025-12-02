import { useQuery, useMutation, useQueryClient, keepPreviousData, useInfiniteQuery } from "@tanstack/react-query";
import { fetchOrgUsers, inviteUser, deleteUser, fetchUserNonMemberGroups, type OrgUsersListResponse } from "@/data/users";
import { type UserGroupsListResponse } from "@/data/groups";
import { useAuth } from "@/context/AuthContext";

export const USERS_QUERY_KEY = ["users"];
export const USER_NON_MEMBER_GROUPS_QUERY_KEY = ["user-non-member-groups"];

export function useUsersQuery(page: number = 1) {
  const { isAuthenticated } = useAuth();
  
  return useQuery<OrgUsersListResponse>({
    queryKey: [...USERS_QUERY_KEY, page],
    queryFn: () => fetchOrgUsers(page),
    enabled: isAuthenticated, // Only fetch when user is authenticated
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
    placeholderData: keepPreviousData, // Keep previous page data while fetching new page
  });
}

export function useInviteUser() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: inviteUser,
    onSuccess: () => {
      // Invalidate users when user is invited successfully
      queryClient.invalidateQueries({ queryKey: USERS_QUERY_KEY });
    },
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: deleteUser,
    onSuccess: () => {
      // Invalidate users when user is deleted successfully
      queryClient.invalidateQueries({ queryKey: USERS_QUERY_KEY });
    },
  });
}

export function useUserNonMemberGroupsQuery(userId: string, search?: string) {
  const { isAuthenticated } = useAuth();
  
  return useInfiniteQuery<UserGroupsListResponse>({
    queryKey: [...USER_NON_MEMBER_GROUPS_QUERY_KEY, userId, search || ""],
    queryFn: ({ pageParam = 1 }) => fetchUserNonMemberGroups(userId, pageParam as number, search),
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
    enabled: isAuthenticated && !!userId, // Only fetch when user is authenticated and userId is provided
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  });
}

