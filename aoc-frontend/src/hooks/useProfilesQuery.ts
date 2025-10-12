import { useQuery } from "@tanstack/react-query";
import { fetchProfiles } from "@/data/profiles";

export const PROFILES_QUERY_KEY = ["profiles"];

export function useProfilesQuery() {
  return useQuery({
    queryKey: PROFILES_QUERY_KEY,
    queryFn: fetchProfiles,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  });
}
