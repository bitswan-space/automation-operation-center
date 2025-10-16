import { useQuery } from "@tanstack/react-query";
import { fetchProfiles } from "@/data/profiles";
import { useAuth } from "@/context/AuthContext";

export const PROFILES_QUERY_KEY = ["profiles"];

export function useProfilesQuery() {
  const { isAuthenticated } = useAuth();
  
  return useQuery({
    queryKey: PROFILES_QUERY_KEY,
    queryFn: fetchProfiles,
    enabled: isAuthenticated, // Only fetch when user is authenticated
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  });
}
