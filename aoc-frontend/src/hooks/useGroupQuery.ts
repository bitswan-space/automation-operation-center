import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { createOrgGroup, updateOrgGroup, deleteOrgGroup, fetchOrgGroups, type UserGroupsListResponse } from "@/data/groups";
import { PROFILES_QUERY_KEY } from "./useProfilesQuery";
import { useAuth } from "@/context/AuthContext";

export const USER_GROUPS_QUERY_KEY = ["user-groups"];

export function useGroupsQuery(page: number = 1) {
  const { isAuthenticated } = useAuth();
  
  return useQuery<UserGroupsListResponse>({
    queryKey: [...USER_GROUPS_QUERY_KEY, page],
    queryFn: () => fetchOrgGroups(page),
    enabled: isAuthenticated, // Only fetch when user is authenticated
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
    placeholderData: keepPreviousData, // Keep previous page data while fetching new page
  });
}

export function useCreateGroup() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: createOrgGroup,
    onSuccess: () => {
      // Invalidate profiles and groups when group is created successfully
      queryClient.invalidateQueries({ queryKey: PROFILES_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: USER_GROUPS_QUERY_KEY });
    },
  });
}

export function useUpdateGroup() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: updateOrgGroup,
    onSuccess: () => {
      // Invalidate profiles and groups when group is updated successfully
      queryClient.invalidateQueries({ queryKey: PROFILES_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: USER_GROUPS_QUERY_KEY });
    },
  });
}

export function useDeleteGroup() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: deleteOrgGroup,
    onSuccess: () => {
      // Invalidate profiles and groups when group is deleted successfully
      queryClient.invalidateQueries({ queryKey: PROFILES_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: USER_GROUPS_QUERY_KEY });
    },
  });
}
