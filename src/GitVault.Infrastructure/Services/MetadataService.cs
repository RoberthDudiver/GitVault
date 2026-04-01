using System.Text;
using System.Text.Json;
using GitVault.Core.Common;
using GitVault.Core.Entities;
using GitVault.Core.Services;
using GitVault.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace GitVault.Infrastructure.Services;

/// <summary>
/// Manages file and folder metadata.
///
/// Dual-write strategy:
///   1. SQLite (primary) — for fast queries, listing, resolution
///   2. GitHub repo (secondary) — /meta/files/{ab}/{cd}/{logical_id}.json
///      and /meta/index/public_ids/{ab}/{cd}/{public_id}
///      These act as the source of truth / backup if SQLite is lost.
/// </summary>
public class MetadataService(
    GitVaultDbContext db,
    IGitHubContentService gitHubContent,
    ICacheService cache,
    ILogger<MetadataService> logger) : IMetadataService
{
    public async Task<Result<FileMetadata>> CreateFileMetadataAsync(
        FileMetadata metadata, CancellationToken ct)
    {
        // 1. Persist to SQLite
        db.Files.Add(metadata);
        await db.SaveChangesAsync(ct);

        // 2. Write to repo (fire-and-forget to not block the response)
        _ = WriteFileMetaToRepoAsync(metadata, ct);

        // 3. Cache
        cache.Set(CacheKeys.FileByLogicalId(metadata.LogicalId), metadata, CacheTtl.FileMetadata);
        cache.Set(CacheKeys.FileByPublicId(metadata.PublicId), metadata, CacheTtl.FileMetadata);

        return Result.Ok(metadata);
    }

    public async Task<FileMetadata?> GetByPublicIdAsync(string vaultId, string publicId, CancellationToken ct)
    {
        // Check negative cache first
        if (cache.IsNotFound(CacheKeys.FileNotFound(publicId))) return null;

        // Check positive cache
        if (cache.TryGet<FileMetadata>(CacheKeys.FileByPublicId(publicId), out var cached)) return cached;

        // Query SQLite
        var file = await db.Files.FirstOrDefaultAsync(
            f => f.VaultId == vaultId && f.PublicId == publicId && !f.IsDeleted, ct);

        if (file is null)
        {
            cache.SetNotFound(CacheKeys.FileNotFound(publicId));
            return null;
        }

        cache.Set(CacheKeys.FileByPublicId(publicId), file, CacheTtl.FileMetadata);
        cache.Set(CacheKeys.FileByLogicalId(file.LogicalId), file, CacheTtl.FileMetadata);
        return file;
    }

    public async Task<FileMetadata?> GetByLogicalIdAsync(string vaultId, string logicalId, CancellationToken ct)
    {
        if (cache.TryGet<FileMetadata>(CacheKeys.FileByLogicalId(logicalId), out var cached)) return cached;

        var file = await db.Files.FirstOrDefaultAsync(
            f => f.VaultId == vaultId && f.LogicalId == logicalId && !f.IsDeleted, ct);

        if (file is not null)
            cache.Set(CacheKeys.FileByLogicalId(logicalId), file, CacheTtl.FileMetadata);

        return file;
    }

    public async Task<(IReadOnlyList<FileMetadata> Items, int Total)> ListFilesAsync(
        string vaultId, string? folderId, int page, int pageSize, CancellationToken ct)
    {
        var query = db.Files.Where(f => f.VaultId == vaultId && !f.IsDeleted);
        if (folderId is not null) query = query.Where(f => f.FolderId == folderId);

        var total = await query.CountAsync(ct);
        var items = await query
            .OrderByDescending(f => f.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(ct);

        return (items, total);
    }

    public async Task<Result<FileMetadata>> UpdateFileAsync(FileMetadata metadata, CancellationToken ct)
    {
        metadata.UpdatedAt = DateTime.UtcNow;
        db.Files.Update(metadata);
        await db.SaveChangesAsync(ct);

        // Invalidate cache
        cache.Remove(CacheKeys.FileByLogicalId(metadata.LogicalId));
        cache.Remove(CacheKeys.FileByPublicId(metadata.PublicId));

        _ = WriteFileMetaToRepoAsync(metadata, ct);

        return Result.Ok(metadata);
    }

    public async Task<Result<bool>> SoftDeleteFileAsync(string vaultId, string logicalId, CancellationToken ct)
    {
        var file = await db.Files.FirstOrDefaultAsync(
            f => f.VaultId == vaultId && f.LogicalId == logicalId, ct);

        if (file is null) return Result.Fail<bool>(ErrorCodes.NotFound, "File not found.");

        file.IsDeleted = true;
        file.DeletedAt = DateTime.UtcNow;
        file.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync(ct);

        cache.Remove(CacheKeys.FileByLogicalId(logicalId));
        cache.Remove(CacheKeys.FileByPublicId(file.PublicId));
        cache.SetNotFound(CacheKeys.FileNotFound(file.PublicId));

        return Result.Ok(true);
    }

    // ── Folders ───────────────────────────────────────────────────────────────

    public async Task<Result<FolderMetadata>> CreateFolderAsync(FolderMetadata folder, CancellationToken ct)
    {
        db.Folders.Add(folder);
        await db.SaveChangesAsync(ct);
        cache.Set(CacheKeys.Folder(folder.FolderId), folder, CacheTtl.Folder);
        return Result.Ok(folder);
    }

    public async Task<FolderMetadata?> GetFolderAsync(string vaultId, string folderId, CancellationToken ct)
    {
        if (cache.IsNotFound(CacheKeys.FolderNotFound(folderId))) return null;
        if (cache.TryGet<FolderMetadata>(CacheKeys.Folder(folderId), out var cached)) return cached;

        var folder = await db.Folders.FirstOrDefaultAsync(
            f => f.VaultId == vaultId && f.FolderId == folderId, ct);

        if (folder is null) cache.SetNotFound(CacheKeys.FolderNotFound(folderId));
        else cache.Set(CacheKeys.Folder(folderId), folder, CacheTtl.Folder);

        return folder;
    }

    public async Task<IReadOnlyList<FolderMetadata>> ListFoldersAsync(
        string vaultId, string? parentFolderId, CancellationToken ct)
    {
        var cacheKey = CacheKeys.FolderList(vaultId, parentFolderId);
        if (cache.TryGet<List<FolderMetadata>>(cacheKey, out var cached)) return cached!;

        var folders = await db.Folders
            .Where(f => f.VaultId == vaultId && f.ParentFolderId == parentFolderId)
            .OrderBy(f => f.Name)
            .ToListAsync(ct);

        cache.Set(cacheKey, folders, CacheTtl.Folder);
        return folders;
    }

    public async Task<Result<FolderMetadata>> UpdateFolderAsync(FolderMetadata folder, CancellationToken ct)
    {
        folder.UpdatedAt = DateTime.UtcNow;
        db.Folders.Update(folder);
        await db.SaveChangesAsync(ct);
        cache.Remove(CacheKeys.Folder(folder.FolderId));
        return Result.Ok(folder);
    }

    // ── Repo persistence (secondary, async) ──────────────────────────────────

    private async Task WriteFileMetaToRepoAsync(FileMetadata metadata, CancellationToken ct)
    {
        try
        {
            var vault = await db.Vaults.FindAsync([metadata.VaultId], ct);
            if (vault is null) return;

            var json = JsonSerializer.Serialize(new
            {
                logical_id = metadata.LogicalId,
                public_id = metadata.PublicId,
                original_name = metadata.OriginalName,
                content_type = metadata.ContentType,
                size_bytes = metadata.SizeBytes,
                sha256 = metadata.Sha256,
                folder_id = metadata.FolderId,
                visibility = metadata.Visibility.ToString().ToLower(),
                is_deleted = metadata.IsDeleted,
                created_at = metadata.CreatedAt.ToString("O"),
                updated_at = metadata.UpdatedAt.ToString("O")
            }, new JsonSerializerOptions { WriteIndented = true });

            var lid = metadata.LogicalId.Replace("-", "");
            var metaPath = $"meta/files/{lid[..2]}/{lid[2..4]}/{metadata.LogicalId}.json";

            // Write the public_id → logical_id index (tiny file, just 36 bytes)
            var pid = metadata.PublicId;
            var indexPath = $"meta/index/public_ids/{pid[..2]}/{pid[2..4]}/{pid}";

            var files = new List<(string Path, byte[] Content)>
            {
                (metaPath, Encoding.UTF8.GetBytes(json)),
                (indexPath, Encoding.UTF8.GetBytes(metadata.LogicalId))
            };

            await gitHubContent.WriteBatchAsync(
                vault.InstallationId,
                vault.RepoFullName,
                vault.DefaultBranch,
                files,
                $"vault: store metadata for {metadata.LogicalId[..8]}",
                ct);
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Failed to write metadata to repo for file {LogicalId}", metadata.LogicalId);
            // Non-fatal: SQLite is the primary store. Repo is secondary.
        }
    }
}
