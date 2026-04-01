"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import {
  useFiles,
  useUploadFile,
  useDeleteFile,
  useUpdateVisibility,
  type FileMetadata,
  getPublicUrl,
} from "@/hooks/useFiles";
import { useVault } from "@/hooks/useVaults";
import { auth } from "@/lib/firebase";
import { servingUrl, thumbUrl } from "@/lib/api";
import { useI18n } from "@/lib/i18n";

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const isImage = (t: string) => t.startsWith("image/");
const isVideo = (t: string) => t.startsWith("video/");
const isAudio = (t: string) => t.startsWith("audio/");
const isPdf = (t: string) => t === "application/pdf";

function fileTypeLabel(contentType: string) {
  if (!contentType) return "FILE";
  if (isImage(contentType)) return contentType.replace("image/", "").toUpperCase();
  if (isVideo(contentType)) return contentType.replace("video/", "").toUpperCase();
  if (isAudio(contentType)) return contentType.replace("audio/", "").toUpperCase();
  if (isPdf(contentType)) return "PDF";
  if (contentType.includes("zip") || contentType.includes("tar") || contentType.includes("gzip")) return "ZIP";
  if (contentType.startsWith("text/")) return "TXT";
  if (contentType.includes("word")) return "DOC";
  if (contentType.includes("excel") || contentType.includes("spreadsheet")) return "XLS";
  if (contentType.includes("powerpoint") || contentType.includes("presentation")) return "PPT";
  return contentType.split("/")[1]?.toUpperCase() ?? "FILE";
}

// ── Type icon (for non-image cards) ──────────────────────────────────────────

function TypeIcon({ contentType, size = 32 }: { contentType: string; size?: number }) {
  const s = size;
  if (isVideo(contentType)) return (
    <svg width={s} height={s} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" />
    </svg>
  );
  if (isAudio(contentType)) return (
    <svg width={s} height={s} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 9l10.5-3m0 6.553v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 11-.99-3.467l2.31-.66a2.25 2.25 0 001.632-2.163zm0 0V2.25L9 5.25v10.303m0 0v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 01-.99-3.467l2.31-.66A2.25 2.25 0 009 15.553z" />
    </svg>
  );
  if (isPdf(contentType)) return (
    <svg width={s} height={s} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
    </svg>
  );
  return (
    <svg width={s} height={s} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
    </svg>
  );
}

// ── Authenticated file URL (handles private files) ────────────────────────────

function useAuthFileUrl(file: FileMetadata | null) {
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const revokeRef = useRef<string | null>(null);

  useEffect(() => {
    if (!file) { setUrl(null); return; }

    // Public files can be served directly — no fetch needed
    if (file.visibility === "public") {
      setUrl(getPublicUrl(file.publicId, file.originalName));
      return;
    }

    // Private files need the Firebase Bearer token
    setLoading(true);
    let cancelled = false;

    auth.currentUser?.getIdToken().then(async (token) => {
      try {
        const res = await fetch(servingUrl(file.publicId, file.originalName), {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok || cancelled) return;
        const blob = await res.blob();
        if (cancelled) return;
        const objectUrl = URL.createObjectURL(blob);
        revokeRef.current = objectUrl;
        setUrl(objectUrl);
      } finally {
        if (!cancelled) setLoading(false);
      }
    });

    return () => {
      cancelled = true;
      if (revokeRef.current) {
        URL.revokeObjectURL(revokeRef.current);
        revokeRef.current = null;
      }
      setUrl(null);
      setLoading(false);
    };
  }, [file?.publicId, file?.visibility]);

  return { url, loading };
}

// ── Preview Modal ─────────────────────────────────────────────────────────────

function PreviewModal({
  file,
  files,
  onClose,
  onNavigate,
  onDelete,
  onToggleVisibility,
}: {
  file: FileMetadata;
  files: FileMetadata[];
  onClose: () => void;
  onNavigate: (file: FileMetadata) => void;
  onDelete: (logicalId: string) => Promise<void>;
  onToggleVisibility: (file: FileMetadata) => Promise<void>;
}) {
  const { url, loading } = useAuthFileUrl(file);
  const { t } = useI18n();
  const [copied, setCopied] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [toggling, setToggling] = useState(false);

  const idx = files.findIndex((f) => f.logicalId === file.logicalId);
  const hasPrev = idx > 0;
  const hasNext = idx < files.length - 1;

  // Keyboard nav
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft" && hasPrev) onNavigate(files[idx - 1]);
      if (e.key === "ArrowRight" && hasNext) onNavigate(files[idx + 1]);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [idx, hasPrev, hasNext, files, onClose, onNavigate]);

  const handleCopy = () => {
    navigator.clipboard.writeText(getPublicUrl(file.publicId, file.originalName));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await onDelete(file.logicalId);
      onClose();
    } finally {
      setDeleting(false);
    }
  };

  const handleToggle = async () => {
    setToggling(true);
    try { await onToggleVisibility(file); }
    finally { setToggling(false); }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-black/90 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 text-white shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <button onClick={onClose} className="p-1 rounded hover:bg-white/10 transition-colors shrink-0">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <span className="text-sm font-medium truncate">{file.originalName}</span>
          <span className={`shrink-0 text-xs px-2 py-0.5 rounded-full ${
            file.visibility === "public"
              ? "bg-green-500/20 text-green-300"
              : "bg-zinc-500/20 text-zinc-300"
          }`}>
            {file.visibility === "public" ? t("vault.public").toLowerCase() : t("vault.private").toLowerCase()}
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0 ml-3">
          <button
            onClick={handleToggle}
            disabled={toggling}
            className="text-xs px-2 py-1 rounded bg-white/10 hover:bg-white/20 disabled:opacity-50 transition-colors"
          >
            {toggling ? "\u2026" : file.visibility === "public" ? t("file.makePrivate") : t("file.makePublic")}
          </button>
          <button
            onClick={handleCopy}
            className="text-xs px-2 py-1 rounded bg-white/10 hover:bg-white/20 transition-colors"
          >
            {copied ? t("file.copied") : t("file.copyUrl")}
          </button>
          <a
            href={url ?? "#"}
            download={file.originalName}
            className="text-xs px-2 py-1 rounded bg-white/10 hover:bg-white/20 transition-colors"
          >
            {t("file.download")}
          </a>
          {!confirmDelete ? (
            <button
              onClick={() => setConfirmDelete(true)}
              className="text-xs px-2 py-1 rounded bg-red-500/20 hover:bg-red-500/40 text-red-300 transition-colors"
            >
              {t("file.delete")}
            </button>
          ) : (
            <div className="flex items-center gap-1">
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="text-xs px-2 py-1 rounded bg-red-600 hover:bg-red-700 text-white disabled:opacity-50 transition-colors flex items-center gap-1"
              >
                {deleting && <span className="h-3 w-3 animate-spin rounded-full border-2 border-white/40 border-t-white" />}
                {deleting ? t("file.deleting") : t("file.confirm")}
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                className="text-xs px-2 py-1 rounded bg-white/10 hover:bg-white/20 transition-colors"
              >
                {t("file.cancel")}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center px-4 min-h-0 relative">
        {/* Prev */}
        {hasPrev && (
          <button
            onClick={() => onNavigate(files[idx - 1])}
            className="absolute left-2 z-10 p-2 rounded-full bg-black/50 hover:bg-black/70 text-white transition-colors"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        )}

        {loading && (
          <div className="flex flex-col items-center gap-3 text-white/60">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-white/20 border-t-white/80" />
            <span className="text-sm">{t("file.loading")}</span>
          </div>
        )}

        {!loading && url && isImage(file.contentType) && (
          <img
            src={url}
            alt={file.originalName}
            className="max-h-full max-w-full object-contain rounded-lg shadow-2xl"
            style={{ maxHeight: "calc(100vh - 140px)" }}
          />
        )}

        {!loading && url && isVideo(file.contentType) && (
          <video
            src={url}
            controls
            autoPlay
            className="max-h-full max-w-full rounded-lg shadow-2xl"
            style={{ maxHeight: "calc(100vh - 140px)" }}
          />
        )}

        {!loading && url && isAudio(file.contentType) && (
          <div className="flex flex-col items-center gap-6 text-white">
            <TypeIcon contentType={file.contentType} size={80} />
            <p className="text-lg font-medium">{file.originalName}</p>
            <audio src={url} controls autoPlay className="w-80" />
          </div>
        )}

        {!loading && url && isPdf(file.contentType) && (
          <iframe
            src={url}
            className="w-full rounded-lg shadow-2xl bg-white"
            style={{ height: "calc(100vh - 140px)" }}
            title={file.originalName}
          />
        )}

        {!loading && url && !isImage(file.contentType) && !isVideo(file.contentType) && !isAudio(file.contentType) && !isPdf(file.contentType) && (
          <div className="flex flex-col items-center gap-4 text-white">
            <div className="text-white/60">
              <TypeIcon contentType={file.contentType} size={64} />
            </div>
            <p className="text-lg font-medium">{file.originalName}</p>
            <p className="text-sm text-white/60">{fileTypeLabel(file.contentType)} · {formatBytes(file.sizeBytes)}</p>
            <a
              href={url}
              download={file.originalName}
              className="mt-2 rounded-lg bg-white text-zinc-900 px-5 py-2 text-sm font-medium hover:bg-zinc-100 transition-colors"
            >
              {t("file.downloadFile")}
            </a>
          </div>
        )}

        {!loading && !url && (
          <div className="flex flex-col items-center gap-4 text-white/60">
            <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <p className="text-sm">{t("file.noPreview")}</p>
          </div>
        )}

        {/* Next */}
        {hasNext && (
          <button
            onClick={() => onNavigate(files[idx + 1])}
            className="absolute right-2 z-10 p-2 rounded-full bg-black/50 hover:bg-black/70 text-white transition-colors"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        )}
      </div>

      {/* Bottom bar */}
      <div className="shrink-0 px-4 py-2 text-center text-xs text-white/40">
        {idx + 1} / {files.length} · {formatBytes(file.sizeBytes)} · {fileTypeLabel(file.contentType)}
      </div>
    </div>
  );
}

// ── Gallery card ──────────────────────────────────────────────────────────────

function GalleryCard({
  file,
  onPreview,
  onCopyUrl,
  onToggleVisibility,
  onConfirmDelete,
  isConfirming,
  isDeleting,
  copiedId,
}: {
  file: FileMetadata;
  onPreview: () => void;
  onCopyUrl: () => void;
  onToggleVisibility: () => void;
  onConfirmDelete: (confirm: boolean) => void;
  isConfirming: boolean;
  isDeleting: boolean;
  copiedId: string | null;
}) {
  const { t } = useI18n();
  const thumb = isImage(file.contentType) ? thumbUrl(file.publicId) : null;
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);

  return (
    <div className="group relative aspect-square rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900 hover:border-zinc-400 dark:hover:border-zinc-600 transition-all hover:shadow-lg">

      {/* Clickable image / icon area */}
      <button
        onClick={onPreview}
        className="absolute inset-0 w-full h-full focus:outline-none"
        aria-label={`Preview ${file.originalName}`}
      >
        {thumb && !imgError ? (
          <>
            {/* Loading skeleton */}
            {!imgLoaded && (
              <div className="absolute inset-0 bg-zinc-200 dark:bg-zinc-800 animate-pulse flex items-center justify-center">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-300 dark:border-zinc-600 border-t-zinc-500 dark:border-t-zinc-400" />
              </div>
            )}
            <img
              src={thumb}
              alt={file.originalName}
              className={`h-full w-full object-cover transition-all group-hover:scale-105 ${imgLoaded ? "opacity-100" : "opacity-0"}`}
              loading="lazy"
              onLoad={() => setImgLoaded(true)}
              onError={() => { setImgError(true); setImgLoaded(true); }}
            />
          </>
        ) : (
          <div className="h-full w-full flex flex-col items-center justify-center gap-2 text-zinc-400 dark:text-zinc-600">
            <TypeIcon contentType={file.contentType} size={36} />
            <span className="text-xs font-medium">{fileTypeLabel(file.contentType)}</span>
          </div>
        )}
      </button>

      {/* Delete confirmation overlay — shown ON the card */}
      {isConfirming && (
        <div className="absolute inset-0 z-20 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center gap-3 p-3">
          <p className="text-white text-xs font-medium text-center">{t("file.deleteConfirm")}</p>
          <div className="flex items-center gap-2">
            <button
              onClick={(e) => { e.stopPropagation(); onConfirmDelete(true); }}
              disabled={isDeleting}
              className="rounded-lg bg-red-600 hover:bg-red-700 disabled:opacity-50 px-3 py-1.5 text-xs font-medium text-white flex items-center gap-1.5 transition-colors"
            >
              {isDeleting && <span className="h-3 w-3 animate-spin rounded-full border-2 border-white/40 border-t-white" />}
              {isDeleting ? t("file.deleting") : t("file.yesDelete")}
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onConfirmDelete(false); }}
              disabled={isDeleting}
              className="rounded-lg border border-zinc-500 px-3 py-1.5 text-xs text-zinc-300 hover:bg-zinc-700 disabled:opacity-50 transition-colors"
            >
              {t("file.cancel")}
            </button>
          </div>
        </div>
      )}

      {/* Hover overlay with filename + action buttons */}
      {!isConfirming && (
        <div className="absolute inset-x-0 bottom-0 translate-y-full group-hover:translate-y-0 transition-transform duration-200 bg-gradient-to-t from-black/90 via-black/70 to-transparent pt-6 pb-2 px-2">
          <p className="text-white text-xs font-medium truncate mb-1.5">{file.originalName}</p>
          <div className="flex items-center gap-1">
            <button
              onClick={(e) => { e.stopPropagation(); onToggleVisibility(); }}
              title={file.visibility === "public" ? t("file.makePrivate") : t("file.makePublic")}
              className={`flex-1 text-center text-xs py-1 rounded-md transition-colors ${
                file.visibility === "public"
                  ? "bg-green-500/30 hover:bg-green-500/50 text-green-300"
                  : "bg-zinc-500/30 hover:bg-zinc-500/50 text-zinc-300"
              }`}
            >
              {file.visibility === "public" ? t("vault.public") : t("vault.private")}
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onCopyUrl(); }}
              title={t("file.copyUrl")}
              className="flex-1 text-center text-xs py-1 rounded-md bg-white/10 hover:bg-white/20 text-white transition-colors"
            >
              {copiedId === file.logicalId ? "\u2713" : t("file.copy")}
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onConfirmDelete(true); }}
              title={t("file.delete")}
              className="flex-1 text-center text-xs py-1 rounded-md bg-red-500/30 hover:bg-red-500/50 text-red-300 transition-colors"
            >
              {t("file.delete")}
            </button>
          </div>
        </div>
      )}

      {/* Visibility badge (top-right, always visible) */}
      <div className={`absolute top-1.5 right-1.5 z-10 rounded-full px-1.5 py-0.5 text-xs font-medium ${
        file.visibility === "private"
          ? "bg-black/60 text-white"
          : "bg-green-500/80 text-white"
      }`}>
        {file.visibility === "private" ? "🔒" : "🌐"}
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function VaultExplorerPage() {
  const { vaultId } = useParams<{ vaultId: string }>();
  const { data: vault } = useVault(vaultId);
  const { data, isLoading, error } = useFiles(vaultId);
  const uploadFile = useUploadFile(vaultId);
  const deleteFile = useDeleteFile(vaultId);
  const updateVisibility = useUpdateVisibility(vaultId);

  const [viewMode, setViewMode] = useState<"gallery" | "table">("gallery");
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [uploadVisibility, setUploadVisibility] = useState<"public" | "private">("public");

  // Preview
  const [previewFile, setPreviewFile] = useState<FileMetadata | null>(null);

  // Per-row table actions
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [toggleError, setToggleError] = useState<string | null>(null);

  const handleFiles = useCallback(
    async (files: FileList | null) => {
      if (!files || files.length === 0) return;
      setUploading(true);
      setUploadError("");
      try {
        for (const file of Array.from(files)) {
          await uploadFile.mutateAsync({ file, visibility: uploadVisibility });
        }
      } catch {
        setUploadError(t("vault.uploadFailed"));
      } finally {
        setUploading(false);
      }
    },
    [uploadFile, uploadVisibility]
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
    navigator.clipboard.writeText(getPublicUrl(file.publicId, file.originalName));
    setCopiedId(file.logicalId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleToggleVisibility = async (file: FileMetadata) => {
    const next = file.visibility === "public" ? "private" : "public";
    setTogglingId(file.logicalId);
    setToggleError(null);
    try {
      await updateVisibility.mutateAsync({ logicalId: file.logicalId, visibility: next });
      // If previewing this file, refresh it
      if (previewFile?.logicalId === file.logicalId) {
        setPreviewFile((f) => f ? { ...f, visibility: next } : null);
      }
    } catch {
      setToggleError(file.logicalId);
    } finally {
      setTogglingId(null);
    }
  };

  const handleConfirmDelete = async (logicalId: string) => {
    setDeletingId(logicalId);
    setDeleteError(null);
    try {
      await deleteFile.mutateAsync(logicalId);
      setConfirmDeleteId(null);
      if (previewFile?.logicalId === logicalId) setPreviewFile(null);
    } catch {
      setDeleteError(logicalId);
      setDeletingId(null);
    }
  };

  const { t } = useI18n();
  const files = data?.files ?? [];

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold">{vault?.repoFullName ?? t("vault.explorer")}</h1>
          <p className="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400">{vaultId}</p>
        </div>
        {/* View toggle */}
        <div className="flex rounded-lg border border-zinc-200 dark:border-zinc-700 overflow-hidden shrink-0">
          <button
            onClick={() => setViewMode("gallery")}
            title={t("vault.galleryView")}
            className={`px-2.5 py-1.5 transition-colors ${viewMode === "gallery" ? "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900" : "bg-white dark:bg-zinc-900 text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-800"}`}
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
            </svg>
          </button>
          <button
            onClick={() => setViewMode("table")}
            title={t("vault.tableView")}
            className={`px-2.5 py-1.5 border-l border-zinc-200 dark:border-zinc-700 transition-colors ${viewMode === "table" ? "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900" : "bg-white dark:bg-zinc-900 text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-800"}`}
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 12h.007v.008H3.75V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-.375 5.25h.007v.008H3.75v-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Upload area */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">{t("vault.uploadAs")}</span>
          <div className="flex rounded-lg border border-zinc-200 dark:border-zinc-700 overflow-hidden">
            <button type="button" onClick={() => setUploadVisibility("public")}
              className={`px-3 py-1 text-xs font-medium transition-colors ${uploadVisibility === "public" ? "bg-green-600 text-white" : "bg-white dark:bg-zinc-900 text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-800"}`}>
              {t("vault.public")}
            </button>
            <button type="button" onClick={() => setUploadVisibility("private")}
              className={`px-3 py-1 text-xs font-medium transition-colors border-l border-zinc-200 dark:border-zinc-700 ${uploadVisibility === "private" ? "bg-zinc-700 text-white" : "bg-white dark:bg-zinc-900 text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-800"}`}>
              {t("vault.private")}
            </button>
          </div>
          <span className="text-xs text-zinc-400 dark:text-zinc-500">
            {uploadVisibility === "public" ? t("vault.publicDesc") : t("vault.privateDesc")}
          </span>
        </div>

        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          className={`relative rounded-xl border-2 border-dashed transition-colors ${dragging ? "border-zinc-500 bg-zinc-50 dark:bg-zinc-800" : "border-zinc-300 dark:border-zinc-700 hover:border-zinc-400 dark:hover:border-zinc-600"}`}
        >
          <label className="flex cursor-pointer flex-col items-center gap-2 py-10 px-4 text-center">
            <input type="file" multiple className="sr-only" onChange={(e) => handleFiles(e.target.files)} />
            {uploading ? (
              <>
                <div className="h-6 w-6 animate-spin rounded-full border-4 border-zinc-300 border-t-zinc-800" />
                <span className="text-sm text-zinc-500">{t("vault.uploading")}</span>
              </>
            ) : (
              <>
                <svg className="h-8 w-8 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <span className="text-sm text-zinc-500 dark:text-zinc-400">
                  {t("vault.dropFiles")} <span className="underline">{t("vault.browse")}</span>
                </span>
                <span className="text-xs text-zinc-400 dark:text-zinc-500">{t("vault.fileLimits")}</span>
              </>
            )}
          </label>
        </div>
      </div>

      {uploadError && <p className="mb-4 text-sm text-red-600 dark:text-red-400">{uploadError}</p>}

      {isLoading && (
        <div className="flex justify-center py-12">
          <div className="h-6 w-6 animate-spin rounded-full border-4 border-zinc-300 border-t-zinc-800" />
        </div>
      )}

      {error && <p className="text-sm text-red-600 dark:text-red-400 text-center py-8">{t("vault.loadFailed")}</p>}

      {!isLoading && !error && files.length === 0 && (
        <div className="rounded-xl border border-dashed border-zinc-300 dark:border-zinc-700 py-12 text-center">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">{t("vault.noFiles")}</p>
        </div>
      )}

      {/* ── Gallery view ──────────────────────────────────────────────────── */}
      {!isLoading && !error && files.length > 0 && viewMode === "gallery" && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {files.map((file) => (
            <GalleryCard
              key={file.logicalId}
              file={file}
              copiedId={copiedId}
              isConfirming={confirmDeleteId === file.logicalId}
              isDeleting={deletingId === file.logicalId}
              onPreview={() => setPreviewFile(file)}
              onCopyUrl={() => handleCopy(file)}
              onToggleVisibility={() => handleToggleVisibility(file)}
              onConfirmDelete={(confirm) => {
                if (confirm && confirmDeleteId === file.logicalId) {
                  handleConfirmDelete(file.logicalId);
                } else if (confirm) {
                  setConfirmDeleteId(file.logicalId);
                } else {
                  setConfirmDeleteId(null);
                }
              }}
            />
          ))}
        </div>
      )}

      {/* ── Table view ────────────────────────────────────────────────────── */}
      {!isLoading && !error && files.length > 0 && viewMode === "table" && (
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-zinc-500 dark:text-zinc-400">{t("table.name")}</th>
                <th className="text-left px-4 py-3 font-medium text-zinc-500 dark:text-zinc-400 hidden sm:table-cell">{t("table.type")}</th>
                <th className="text-left px-4 py-3 font-medium text-zinc-500 dark:text-zinc-400 hidden md:table-cell">{t("table.size")}</th>
                <th className="text-left px-4 py-3 font-medium text-zinc-500 dark:text-zinc-400">{t("table.visibility")}</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {files.map((file) => {
                const isConfirming = confirmDeleteId === file.logicalId;
                const isDeleting = deletingId === file.logicalId;
                const isToggling = togglingId === file.logicalId;

                return (
                  <tr key={file.logicalId} className="bg-white dark:bg-zinc-950 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors">
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setPreviewFile(file)}
                        className="font-medium text-zinc-900 dark:text-zinc-100 hover:underline truncate max-w-xs block text-left"
                        title={file.originalName}
                      >
                        {file.originalName || "—"}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-zinc-500 dark:text-zinc-400 hidden sm:table-cell">{fileTypeLabel(file.contentType)}</td>
                    <td className="px-4 py-3 text-zinc-500 dark:text-zinc-400 hidden md:table-cell">{formatBytes(file.sizeBytes)}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => !isToggling && handleToggleVisibility(file)}
                        disabled={isToggling}
                        className={`text-xs px-2 py-0.5 rounded-full transition-colors cursor-pointer disabled:opacity-50 ${
                          file.visibility === "public"
                            ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 hover:bg-green-200"
                            : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200"
                        }`}
                      >
                        {isToggling ? "\u2026" : file.visibility === "public" ? t("vault.public").toLowerCase() : t("vault.private").toLowerCase()}
                      </button>
                      {toggleError === file.logicalId && <span className="ml-1 text-xs text-red-500">{t("file.failed")}</span>}
                    </td>
                    <td className="px-4 py-3">
                      {isConfirming ? (
                        <div className="flex items-center justify-end gap-2">
                          <span className="text-xs text-zinc-500">{t("table.deleteQ")}</span>
                          <button onClick={() => handleConfirmDelete(file.logicalId)} disabled={isDeleting}
                            className="text-xs font-medium text-red-600 hover:text-red-800 dark:text-red-400 disabled:opacity-50 flex items-center gap-1">
                            {isDeleting && <span className="h-3 w-3 animate-spin rounded-full border-2 border-red-300 border-t-red-600" />}
                            {isDeleting ? t("file.deleting") : t("table.yes")}
                          </button>
                          {!isDeleting && (
                            <button onClick={() => setConfirmDeleteId(null)} className="text-xs text-zinc-400 hover:text-zinc-600">{t("table.no")}</button>
                          )}
                          {deleteError === file.logicalId && <span className="text-xs text-red-500">{t("file.failed")}</span>}
                        </div>
                      ) : (
                        <div className="flex items-center justify-end gap-3">
                          <button onClick={() => handleCopy(file)} className="text-xs text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 transition-colors">
                            {copiedId === file.logicalId ? t("file.copied") : t("file.copyUrl")}
                          </button>
                          <button onClick={() => setPreviewFile(file)} className="text-xs text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 transition-colors">
                            {t("file.preview")}
                          </button>
                          <button onClick={() => setConfirmDeleteId(file.logicalId)} className="text-xs text-red-500 hover:text-red-700 dark:text-red-400 transition-colors">
                            {t("file.delete")}
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Preview Modal ─────────────────────────────────────────────────── */}
      {previewFile && (
        <PreviewModal
          file={previewFile}
          files={files}
          onClose={() => setPreviewFile(null)}
          onNavigate={setPreviewFile}
          onDelete={handleConfirmDelete}
          onToggleVisibility={handleToggleVisibility}
        />
      )}
    </div>
  );
}
