"use client";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

export function useBranches(companyErp: string | undefined) {
  return useQuery({
    queryKey: ["branches", companyErp],
    queryFn: () => {
        if (!companyErp) return Promise.resolve([]); 
        return apiClient.getBranches(companyErp);
    },
    enabled: !!companyErp, // Only query if company is selected
    staleTime: 1000 * 60 * 10, // 10 minutes
    gcTime: 1000 * 60 * 20, // 20 minutes (keep in cache)
    refetchOnWindowFocus: false, // Don't refetch on window focus
    refetchOnMount: false, // Don't refetch on component mount if data exists
    retry: 2, // Retry failed requests twice
  });
}