"use client";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

export function useCompanies() {
  return useQuery({
    queryKey: ["companies"],
    queryFn: apiClient.getCompanies,
    staleTime: 1000 * 60 * 15, // 15 minutes (companies rarely change)
    gcTime: 1000 * 60 * 30, // 30 minutes (keep in cache longer)
    refetchOnWindowFocus: false, // Don't refetch on window focus
    refetchOnMount: false, // Don't refetch on component mount if data exists
    retry: 2, // Retry failed requests twice
  });
}