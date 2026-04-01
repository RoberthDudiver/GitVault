"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, servingUrl } from "@/lib/api";

export interface FileMetadata {
  logicalId: string;
  publicId: string;
  url: string;
  originalName: string;
  contentType: string;
  sizeBytes: number;
  visibility: "public" | "private";
  folderId: string | null;
  createdAt: string;
  updatedAt: string;
}

export function useFiles(vaultId: string, folderId?: string) {
  return useQuery({
    queryKey: ["files", vaultId, folderId],
    queryFn: async () => {
      const params = folderId ? { folderId } : {};
      const { data } = await api.get(`/vaults/${vaultId}/files`, { params });
      return data as { files: FileMetadata[]; total: number };
    },
    enabled: !!vaultId,
  });
}

export function useUploadFile(vaultId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      file: File;
      folderId?: string;
      visibility?: "public" | "private";
    }) => {
      const form = new FormData();
      form.append("file", payload.file);
      if (payload.folderId) form.append("folderId", payload.folderId);
      form.append("visibility", payload.visibility ?? "public");
      const { data } = await api.post(`/vaults/${vaultId}/files`, form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return data as FileMetadata;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["files", vaultId, variables.folderId] });
    },
  });
}

export function useDeleteFile(vaultId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (logicalId: string) =>
      api.delete(`/vaults/${vaultId}/files/${logicalId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["files", vaultId] });
    },
  });
}

export function useUpdateVisibility(vaultId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ logicalId, visibility }: { logicalId: string; visibility: "public" | "private" }) =>
      api.patch(`/vaults/${vaultId}/files/${logicalId}`, { visibility }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["files", vaultId] });
    },
  });
}

export function getPublicUrl(publicId: string) {
  return servingUrl(publicId);
}
