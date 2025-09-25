"use client";

import { useQuery } from "@tanstack/react-query";

interface Config {
  bitswanBackendApiUrl: string;
}

export function useConfig() {
  return useQuery<Config>({
    queryKey: ["config"],
    queryFn: async () => {
      const response = await fetch("/api/config");
      if (!response.ok) {
        throw new Error("Failed to fetch config");
      }
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 3,
  });
}
