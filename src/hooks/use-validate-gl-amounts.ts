"use client";
import { useMutation } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

export function useValidateGLAmounts() {
  return useMutation({
    mutationFn: ({ entries, invoiceAmount }: { entries: any[]; invoiceAmount: number }) =>
      apiClient.validateGLAmounts(entries, invoiceAmount),
  });
}