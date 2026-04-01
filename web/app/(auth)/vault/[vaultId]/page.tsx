"use client";

import { useCallback, useState } from "react";
import { useParams } from "next/navigation";
import { useFiles, useUploadFile, useDeleteFile, useUpdateVisibility, type FileMetadata, getPublicUrl } from "@/hooks/useFiles";

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function VaultExplorerPage() {
  const { vaultId } = useParams<{ vaultId: string }>();
  const { data, isLoading, error } = useFiles(vaultId);
  const uploadFile = useUploadFile(vaultId);
  const deleteFile = useDeleteFile(vaultId);
  const updateVisibility = useUpdateVisibility(vaultId);

  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleFiles = useCallback(
    async (files: FileList | null) => {
      if (!files || files.length === 0) return;
      setUploading(true);
      setUploadError("");
      try {
        for (const file of Array.from(files)) {
          await uploadFile.mutateAsync({ file, visibility: "public" });
        }
      } catch {
        setUploadError("Upload failed. Please try again.");
      } finally {
        setUploading(false);
      }
    },
    [uploadFile]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      handleFiles(e.dataTransfer.files);
    },
    [handleFiles]
  );

  const handleCopy = (file: FileMetadata) => {
    const url = getPublicUrl(file.publicId);
    navigator.clipboard.writeText(url);
    setCopiedId(file.logicalId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleToggleVisibility = (file: FileMetadata) => {
    const next = file.visibility === "public" ? "private" : "public";
    updateVisibility.mutate({ logicalId: file.logicalId, visibility: next });
  };

  const handleDelete = (logicalId: string) => {
    if (!confirm("Delete this file? This cannot be undone.")) return;
    deleteFile.mutate(logicalId);
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6">
        <h1 className="text-xl font-semibold">Vault Explorer</h1>
        <p className="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400">{vaultId}</p>
      </div>

      {/* Upload dropzone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className={`relative mb-6 rounded-xl border-2 border-dashed transition-colors ${
          dragging
            ? "border-zinc-500 bg-zinc-50 dark:bg-zinc-800"
            : "border-zinc-300 dark:border-zinc-700 hover:border-zinc-400 dark:hover:border-zinc-600"
        }`}
      >
        <label className="flex cursor-pointer flex-col items-center gap-2 py-10 px-4 text-center">
          <input
            type="file"
            multiple
            className="sr-only"
            onChange={(e) => handleFiles(e.target.files)}
          />
          {uploading ? (
            <>
              <div className="h-6 w-6 animate-spin rounded-full border-4 border-zinc-300 border-t-zinc-800" />
              <span className="text-sm text-zinc-500">Uploading…</span>
            </>
          ) : (
            <>
              <svg className="h-8 w-8 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <span className="text-sm text-zinc-500 dark:text-zinc-400">
                Drop files here or <span className="underline">browse</span>
              </span>
            </>
          )}
        </label>
      </div>

      {uploadError && (
        <p className="mb-4 text-sm text-red-600 dark:text-red-400">{uploadError}</p>
      )}

      {isLoading && (
        <div className="flex justify-center py-12">
          <div className="h-6 w-6 animate-spin rounded-full border-4 border-zinc-300 border-t-zinc-800" />
        </div>
      )}

      {error && (
        <p className="text-sm text-red-600 dark:text-red-400 text-center py-8">
          Failed to load files.
        </p>
      )}

      {!isLoading && !error && data?.files.length === 0 && (
        <div className="rounded-xl border border-dashed border-zinc-300 dark:border-zinc-700 py-12 text-center">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">No files yet. Upload your first file above.</p>
        </div>
      )}

      {data && data.files.length > 0 && (
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-zinc-500 dark:text-zinc-400">Name</th>
                <th className="text-left px-4 py-3 font-medium text-zinc-500 dark:text-zinc-400 hidden sm:table-cell">Type</th>
                <th className="text-left px-4 py-3 font-medium text-zinc-500 dark:text-zinc-400 hidden md:table-cell">Size</th>
                <th className="text-left px-4 py-3 font-medium text-zinc-500 dark:text-zinc-400">Visibility</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {data.files.map((file) => (
                <tr key={file.logicalId} className="bg-white dark:bg-zinc-950 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors">
                  <td className="px-4 py-3">
                    <a
                      href={getPublicUrl(file.publicId)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-zinc-900 dark:text-zinc-100 hover:underline truncate max-w-xs block"
                    >
                      {file.originalName}
                    </a>
                  </td>
                  <td className="px-4 py-3 text-zinc-500 dark:text-zinc-400 hidden sm:table-cell">
                    {file.contentType}
                  </td>
                  <td className="px-4 py-3 text-zinc-500 dark:text-zinc-400 hidden md:table-cell">
                    {formatBytes(file.sizeBytes)}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleToggleVisibility(file)}
                      className={`text-xs px-2 py-0.5 rounded-full transition-colors ${
                        file.visibility === "public"
                          ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 hover:bg-green-200"
                          : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200"
                      }`}
                    >
                      {file.visibility}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleCopy(file)}
                        title="Copy URL"
                        className="text-xs text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 transition-colors"
                      >
                        {copiedId === file.logicalId ? "Copied!" : "Copy URL"}
                      </button>
                      <button
                        onClick={() => handleDelete(file.logicalId)}
                        title="Delete"
                        className="text-xs text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
