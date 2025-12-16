import { useAuth } from "@/context/AuthContext";
import { 
  getWorkspaces, 
  getWorkspaceById, 
  getWorkspaceGroups, 
  getWorkspaceUsers,
  getWorkspaceNonMemberGroups,
  getWorkspaceNonMemberUsers,
  addUserToWorkspace,
  removeUserFromWorkspace
} from "@/data/workspaces";
import { 
  addWorkspaceToGroup, 
  removeWorkspaceFromGroup,
} from "@/data/groups";
import { 
  useInfiniteQuery, 
  useQuery, 
  useMutation, 
  useQueryClient 
} from "@tanstack/react-query";
import { USERS_QUERY_KEY } from "./useUsersQuery";

export const WORKSAPCES_QUERY_KEY = ["workspaces"];
export const WORKSPACE_GROUPS_QUERY_KEY = ["workspace-groups"];
export const WORKSPACE_USERS_QUERY_KEY = ["workspace-users"];
export const WORKSPACE_NON_MEMBER_GROUPS_QUERY_KEY = ["workspace-non-member-groups"];
export const WORKSPACE_NON_MEMBER_USERS_QUERY_KEY = ["workspace-non-member-users"];

export function useWorkspacesQuery(search?: string, automationServerId?: string) {
  const { isAuthenticated } = useAuth();

  return useInfiniteQuery({
    queryKey: [...WORKSAPCES_QUERY_KEY, search || "", automationServerId || ""],
    queryFn: ({ pageParam = 1 }) => getWorkspaces(pageParam, search, automationServerId),
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
    enabled: isAuthenticated && !!workspaceId, // Only fetch when user is authenticated and workspaceId is provided
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  });
}

export function useWorkspaceGroupsQuery(workspaceId: string) {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: [...WORKSPACE_GROUPS_QUERY_KEY, workspaceId],
    queryFn: () => getWorkspaceGroups(workspaceId),
    enabled: isAuthenticated && !!workspaceId, // Only fetch when user is authenticated and workspaceId is provided
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  });
}

export function useWorkspaceUsersQuery(workspaceId: string) {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: [...WORKSPACE_USERS_QUERY_KEY, workspaceId],
    queryFn: () => getWorkspaceUsers(workspaceId),
    enabled: isAuthenticated && !!workspaceId, // Only fetch when user is authenticated and workspaceId is provided
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  });
}

export function useWorkspaceNonMemberGroupsQuery(workspaceId: string) {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: [...WORKSPACE_NON_MEMBER_GROUPS_QUERY_KEY, workspaceId],
    queryFn: () => getWorkspaceNonMemberGroups(workspaceId),
    enabled: isAuthenticated && !!workspaceId, // Only fetch when user is authenticated and workspaceId is provided
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  });
}

export function useWorkspaceNonMemberUsersQuery(workspaceId: string) {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: [...WORKSPACE_NON_MEMBER_USERS_QUERY_KEY, workspaceId],
    queryFn: () => getWorkspaceNonMemberUsers(workspaceId),
    enabled: isAuthenticated && !!workspaceId, // Only fetch when user is authenticated and workspaceId is provided
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  });
}

export function useAddWorkspaceToGroup(workspaceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (groupId: string) => addWorkspaceToGroup(workspaceId, groupId),
    onSuccess: () => {
      // Invalidate workspace groups and workspace details when workspace is added to group
      queryClient.invalidateQueries({ queryKey: [...WORKSPACE_GROUPS_QUERY_KEY, workspaceId] });
      queryClient.invalidateQueries({ queryKey: [...WORKSPACE_NON_MEMBER_GROUPS_QUERY_KEY, workspaceId] });
    },
  });
}

export function useRemoveWorkspaceFromGroup(workspaceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (groupId: string) => removeWorkspaceFromGroup(workspaceId, groupId),
    onSuccess: () => {
      // Invalidate workspace groups and workspace details when workspace is removed from group
      queryClient.invalidateQueries({ queryKey: [...WORKSPACE_GROUPS_QUERY_KEY, workspaceId] });
      queryClient.invalidateQueries({ queryKey: [...WORKSPACE_NON_MEMBER_GROUPS_QUERY_KEY, workspaceId] });
    },
  });
}

export function useAddUserToWorkspace(workspaceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: string) => addUserToWorkspace(workspaceId, userId),
    onSuccess: () => {
      // Invalidate users and workspace users when user is added to workspace
      queryClient.invalidateQueries({ queryKey: USERS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: [...WORKSPACE_USERS_QUERY_KEY, workspaceId] });
      queryClient.invalidateQueries({ queryKey: [...WORKSPACE_NON_MEMBER_USERS_QUERY_KEY, workspaceId] });
    },
  });
}

export function useRemoveUserFromWorkspace(workspaceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: string) => removeUserFromWorkspace(workspaceId, userId),
    onSuccess: () => {
      // Invalidate users and workspace users when user is removed from workspace
      queryClient.invalidateQueries({ queryKey: USERS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: [...WORKSPACE_USERS_QUERY_KEY, workspaceId] });
      queryClient.invalidateQueries({ queryKey: [...WORKSPACE_NON_MEMBER_USERS_QUERY_KEY, workspaceId] });
    },
  });
}
