"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export function useVaults() {
  return useQuery({
    queryKey: ["vaults"],
    queryFn: async () => {
      const { data } = await api.get("/vaults");
      return data.vaults as Array<{
        vaultId: string;
        repoFullName: string;
        isPrivate: boolean;
        isInitialized: boolean;
      }>;
    },
  });
}

export function useAvailableRepos() {
  return useQuery({
    queryKey: ["available-repos"],
    queryFn: async () => {
      const { data } = await api.get("/vaults/available-repos");
      return data as Array<{
        id: number;
        fullName: string;
        name: string;
        isPrivate: boolean;
      }>;
    },
    enabled: false, // Only fetch when explicitly called
  });
}

export function useConnectVault() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { repoFullName: string; createIfNotExists?: boolean; isPrivate?: boolean }) =>
      api.post("/vaults", payload).then((r) => r.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["vaults"] }),
  });
}
