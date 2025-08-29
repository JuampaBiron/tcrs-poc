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
    enabled: !!companyErp, //Solo consulta si hay company seleccionada
    staleTime: 1000 * 60 * 10, // 10 minutos
  });
}