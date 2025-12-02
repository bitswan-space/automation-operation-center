import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { fetchOrgUsers, inviteUser, deleteUser, type OrgUsersListResponse } from "@/data/users";
import { useAuth } from "@/context/AuthContext";

export const USERS_QUERY_KEY = ["users"];

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

