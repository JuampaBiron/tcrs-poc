"use client";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

export function useCompanies() {
  return useQuery({
    queryKey: ["companies"],
    queryFn: apiClient.getCompanies,
    staleTime: 1000 * 60 * 10, // 10 minutos
  });
}