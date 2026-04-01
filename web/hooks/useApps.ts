"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export interface AppInfo {
  appId: string;
  name: string;
  scopes: string[];
  vaultIds: string[];
  isActive: boolean;
  createdAt: string;
}

export interface Credential {
  credentialId: string;
  apiKey: string;
  createdAt: string;
}

export function useApps() {
  return useQuery({
    queryKey: ["apps"],
    queryFn: async () => {
      const { data } = await api.get("/apps");
      return data.apps as AppInfo[];
    },
  });
}

export function useApp(appId: string) {
  return useQuery({
    queryKey: ["apps", appId],
    queryFn: async () => {
      const { data } = await api.get(`/apps/${appId}`);
      return data as AppInfo;
    },
    enabled: !!appId,
  });
}

export function useCreateApp() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { name: string; scopes: string[]; vaultIds: string[] }) =>
      api.post("/apps", payload).then((r) => r.data as AppInfo),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["apps"] }),
  });
}

export function useDeleteApp() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (appId: string) => api.delete(`/apps/${appId}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["apps"] }),
  });
}

export function useCredentials(appId: string) {
  return useQuery({
    queryKey: ["apps", appId, "credentials"],
    queryFn: async () => {
      const { data } = await api.get(`/apps/${appId}/credentials`);
      return data.credentials as Credential[];
    },
    enabled: !!appId,
  });
}

export function useCreateCredential(appId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () =>
      api.post(`/apps/${appId}/credentials`).then((r) => r.data as { apiKey: string; apiSecret: string }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["apps", appId, "credentials"] }),
  });
}

export function useRevokeCredential(appId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (credentialId: string) =>
      api.delete(`/apps/${appId}/credentials/${credentialId}`),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["apps", appId, "credentials"] }),
  });
}
