"use client";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

export function useGLDictionaries() {
  return useQuery({
    queryKey: ["gl-dictionaries"],
    queryFn: apiClient.getGLDictionaries,
    staleTime: 1000 * 60 * 60, // 1 hora
  });
}