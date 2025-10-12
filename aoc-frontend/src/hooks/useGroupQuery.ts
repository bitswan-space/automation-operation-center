import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createOrgGroup, updateOrgGroup, deleteOrgGroup } from "@/data/groups";
import { PROFILES_QUERY_KEY } from "./useProfilesQuery";

export function useCreateGroup() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: createOrgGroup,
    onSuccess: () => {
      // Invalidate profiles when group is created successfully
      queryClient.invalidateQueries({ queryKey: PROFILES_QUERY_KEY });
    },
  });
}

export function useUpdateGroup() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: updateOrgGroup,
    onSuccess: () => {
      // Invalidate profiles when group is updated successfully
      queryClient.invalidateQueries({ queryKey: PROFILES_QUERY_KEY });
    },
  });
}

export function useDeleteGroup() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: deleteOrgGroup,
    onSuccess: () => {
      // Invalidate profiles when group is deleted successfully
      queryClient.invalidateQueries({ queryKey: PROFILES_QUERY_KEY });
    },
  });
}
