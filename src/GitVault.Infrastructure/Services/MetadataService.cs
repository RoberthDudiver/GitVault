using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using GitVault.Core.Common;
using GitVault.Core.Entities;
using GitVault.Core.Services;
using GitVault.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace GitVault.Infrastructure.Services;

/// <summary>
/// File metadata is stored ONLY in GitHub (encrypted). SQLite is used only for vault lookups.
///
/// GitHub structure per vault repo:
///   meta/{publicId}   — AES-256-GCM encrypted JSON for each individual file (O(1) serving lookup)
///   meta/_idx.enc     — AES-256-GCM encrypted JSON array of all non-deleted files (for listing)
///
/// Folder metadata continues to live in SQLite (small, structural data).
/// </summary>
public class MetadataService(
    GitVaultDbContext db,
    IGitHubContentService gitHubContent,
    ICacheService cache,
    ICryptoService crypto,
    ILogger<MetadataService> logger) : IMetadataService
{
    private const string IndexPath = "meta/_idx.enc";

    private static readonly JsonSerializerOptions JsonOpts = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower,
        Converters = { new JsonStringEnumConverter() }
    };

    // ── File metadata — GitHub primary ────────────────────────────────────────

    public async Task<Result<FileMetadata>> CreateFileMetadataAsync(
        FileMetadata metadata, CancellationToken ct)
    {
        var vault = await db.Vaults.FindAsync([metadata.VaultId], ct);
        if (vault is null)
            return Result.Fail<FileMetadata>(ErrorCodes.NotFound, "Vault not found.");

        try
        {
            // 1. Read current index (or start fresh)
            var indexList = await ReadIndexAsync(vault, ct);

            // 2. Add new entry
            indexList.Add(metadata);

            // 3. Encrypt both files
            var metaContent = EncryptMetadata(metadata);
            var indexContent = EncryptIndex(indexList);

            // 4. Write individual + index in one atomic commit
            var writeResult = await gitHubContent.WriteBatchAsync(
                vault.InstallationId,
                vault.RepoFullName,
                vault.DefaultBranch,
                [($"meta/{metadata.PublicId}", metaContent), (IndexPath, indexContent)],
                $"vault: add {metadata.PublicId[4..8]}",
                ct);

            if (!writeResult.IsSuccess)
            {
                logger.LogError("WriteBatchAsync failed for {PublicId}: [{Code}] {Error}",
                    metadata.PublicId, writeResult.ErrorCode, writeResult.ErrorMessage);
                return Result.Fail<FileMetadata>(ErrorCodes.GitHubError,
                    writeResult.ErrorMessage ?? "Failed to write metadata to GitHub.");
            }

            // 5. Cache
            cache.Set(CacheKeys.FileByPublicId(metadata.PublicId), metadata, CacheTtl.FileMetadata);
            cache.Set(CacheKeys.FileByLogicalId(metadata.LogicalId), metadata, CacheTtl.FileMetadata);
            cache.Remove(CacheKeys.VaultFileIndex(metadata.VaultId));

            return Result.Ok(metadata);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Failed to write metadata to GitHub for {PublicId}", metadata.PublicId);
            return Result.Fail<FileMetadata>(ErrorCodes.GitHubError, "Failed to store file metadata.");
        }
    }

    public async Task<FileMetadata?> GetByPublicIdAsync(string publicId, CancellationToken ct)
    {
        if (cache.IsNotFound(CacheKeys.FileNotFound(publicId))) return null;
        if (cache.TryGet<FileMetadata>(CacheKeys.FileByPublicId(publicId), out var cached)) return cached;

        // Derive vault from shortCode embedded in publicId
        var shortCode = crypto.ExtractVaultShortCode(publicId);
        var vault = await db.Vaults.FirstOrDefaultAsync(v => v.ShortCode == shortCode, ct);
        if (vault is null)
        {
            cache.SetNotFound(CacheKeys.FileNotFound(publicId));
            return null;
        }

        var file = await gitHubContent.ReadFileAsync(
            vault.InstallationId, vault.RepoFullName, $"meta/{publicId}", ct);

        if (file is null)
        {
            cache.SetNotFound(CacheKeys.FileNotFound(publicId));
            return null;
        }

        var metadata = DecryptMetadata(file.Content);
        if (metadata is null || metadata.IsDeleted)
        {
            cache.SetNotFound(CacheKeys.FileNotFound(publicId));
            return null;
        }

        cache.Set(CacheKeys.FileByPublicId(publicId), metadata, CacheTtl.FileMetadata);
        cache.Set(CacheKeys.FileByLogicalId(metadata.LogicalId), metadata, CacheTtl.FileMetadata);
        return metadata;
    }

    public async Task<FileMetadata?> GetByLogicalIdAsync(string vaultId, string logicalId, CancellationToken ct)
    {
        if (cache.TryGet<FileMetadata>(CacheKeys.FileByLogicalId(logicalId), out var cached)) return cached;

        var vault = await db.Vaults.FindAsync([vaultId], ct);
        if (vault is null) return null;

        var index = await ReadIndexAsync(vault, ct);
        var entry = index.FirstOrDefault(f => f.LogicalId == logicalId && !f.IsDeleted);
        if (entry is null) return null;

        cache.Set(CacheKeys.FileByLogicalId(logicalId), entry, CacheTtl.FileMetadata);
        return entry;
    }

    public async Task<(IReadOnlyList<FileMetadata> Items, int Total)> ListFilesAsync(
        string vaultId, string? folderId, int page, int pageSize, CancellationToken ct)
    {
        var vault = await db.Vaults.FindAsync([vaultId], ct);
        if (vault is null) return ([], 0);

        var index = await ReadIndexAsync(vault, ct);

        var query = index.Where(f => !f.IsDeleted);
        if (folderId is not null) query = query.Where(f => f.FolderId == folderId);

        var sorted = query.OrderByDescending(f => f.CreatedAt).ToList();
        var total = sorted.Count;
        var items = sorted.Skip((page - 1) * pageSize).Take(pageSize).ToList();

        return (items, total);
    }

    public async Task<Result<FileMetadata>> UpdateFileAsync(FileMetadata metadata, CancellationToken ct)
    {
        metadata.UpdatedAt = DateTime.UtcNow;

        var vault = await db.Vaults.FindAsync([metadata.VaultId], ct);
        if (vault is null)
            return Result.Fail<FileMetadata>(ErrorCodes.NotFound, "Vault not found.");

        try
        {
            var indexList = await ReadIndexAsync(vault, ct);
            var idx = indexList.FindIndex(f => f.LogicalId == metadata.LogicalId);
            if (idx >= 0) indexList[idx] = metadata;
            else indexList.Add(metadata);

            var writeResult = await gitHubContent.WriteBatchAsync(
                vault.InstallationId,
                vault.RepoFullName,
                vault.DefaultBranch,
                [($"meta/{metadata.PublicId}", EncryptMetadata(metadata)), (IndexPath, EncryptIndex(indexList))],
                $"vault: update {metadata.PublicId[4..8]}",
                ct);

            if (!writeResult.IsSuccess)
            {
                logger.LogError("WriteBatchAsync (update) failed for {PublicId}: [{Code}] {Error}",
                    metadata.PublicId, writeResult.ErrorCode, writeResult.ErrorMessage);
                return Result.Fail<FileMetadata>(ErrorCodes.GitHubError,
                    writeResult.ErrorMessage ?? "Failed to update metadata in GitHub.");
            }

            cache.Remove(CacheKeys.FileByPublicId(metadata.PublicId));
            cache.Remove(CacheKeys.FileByLogicalId(metadata.LogicalId));
            cache.Remove(CacheKeys.VaultFileIndex(metadata.VaultId));

            return Result.Ok(metadata);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Failed to update metadata for {PublicId}", metadata.PublicId);
            return Result.Fail<FileMetadata>(ErrorCodes.GitHubError, "Failed to update file metadata.");
        }
    }

    public async Task<Result<bool>> SoftDeleteFileAsync(string vaultId, string logicalId, CancellationToken ct)
    {
        var vault = await db.Vaults.FindAsync([vaultId], ct);
        if (vault is null)
            return Result.Fail<bool>(ErrorCodes.NotFound, "Vault not found.");

        var indexList = await ReadIndexAsync(vault, ct);
        var entry = indexList.FirstOrDefault(f => f.LogicalId == logicalId);
        if (entry is null)
            return Result.Fail<bool>(ErrorCodes.NotFound, "File not found.");

        // Mark deleted
        entry.IsDeleted = true;
        entry.DeletedAt = DateTime.UtcNow;
        entry.UpdatedAt = DateTime.UtcNow;

        try
        {
            // Remove from active index; write updated individual file
            var activeIndex = indexList.Where(f => !f.IsDeleted).ToList();

            var writeResult = await gitHubContent.WriteBatchAsync(
                vault.InstallationId,
                vault.RepoFullName,
                vault.DefaultBranch,
                [($"meta/{entry.PublicId}", EncryptMetadata(entry)), (IndexPath, EncryptIndex(activeIndex))],
                $"vault: delete {entry.PublicId[4..8]}",
                ct);

            if (!writeResult.IsSuccess)
            {
                logger.LogError("WriteBatchAsync (delete) failed for {LogicalId}: [{Code}] {Error}",
                    logicalId, writeResult.ErrorCode, writeResult.ErrorMessage);
                return Result.Fail<bool>(ErrorCodes.GitHubError,
                    writeResult.ErrorMessage ?? "Failed to delete metadata in GitHub.");
            }

            cache.Remove(CacheKeys.FileByPublicId(entry.PublicId));
            cache.Remove(CacheKeys.FileByLogicalId(logicalId));
            cache.Remove(CacheKeys.FileNotFound(entry.PublicId));
            cache.Remove(CacheKeys.VaultFileIndex(vaultId));

            return Result.Ok(true);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Failed to delete metadata for logicalId {LogicalId}", logicalId);
            return Result.Fail<bool>(ErrorCodes.GitHubError, "Failed to delete file metadata.");
        }
    }

    // ── Folders — SQLite (small, structural) ─────────────────────────────────

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

    // ── GitHub index helpers ──────────────────────────────────────────────────

    private async Task<List<FileMetadata>> ReadIndexAsync(
        GitVault.Core.Entities.VaultRepository vault, CancellationToken ct)
    {
        // Try cache first
        var cacheKey = CacheKeys.VaultFileIndex(vault.VaultId);
        if (cache.TryGet<List<FileMetadata>>(cacheKey, out var cachedList)) return cachedList!;

        var file = await gitHubContent.ReadFileAsync(
            vault.InstallationId, vault.RepoFullName, IndexPath, ct);

        if (file is null)
        {
            logger.LogWarning("Index file not found for vault {VaultId} ({Repo})", vault.VaultId, vault.RepoFullName);
            return [];
        }

        var json = DecryptGitHubFileContent(file.Content);
        if (json is null)
        {
            logger.LogWarning("Failed to decrypt index for vault {VaultId}", vault.VaultId);
            return [];
        }

        var list = JsonSerializer.Deserialize<List<FileMetadata>>(json, JsonOpts) ?? [];

        // Cache the index with a moderate TTL
        cache.Set(cacheKey, list, CacheTtl.VaultFileIndex);
        return list;
    }

    private byte[] EncryptMetadata(FileMetadata metadata)
    {
        var json = JsonSerializer.Serialize(metadata, JsonOpts);
        return Encoding.UTF8.GetBytes(crypto.Encrypt(json));
    }

    private byte[] EncryptIndex(List<FileMetadata> index)
    {
        var json = JsonSerializer.Serialize(index, JsonOpts);
        return Encoding.UTF8.GetBytes(crypto.Encrypt(json));
    }

    private FileMetadata? DecryptMetadata(string githubBase64Content)
    {
        var json = DecryptGitHubFileContent(githubBase64Content);
        if (json is null) return null;
        return JsonSerializer.Deserialize<FileMetadata>(json, JsonOpts);
    }

    /// <summary>
    /// GitHub returns file content double-encoded: the file bytes are returned as base64.
    /// Our file bytes are UTF-8 of the AES-GCM base64. So the round-trip is:
    ///   encode: encrypt(json) → encB64 → UTF8.GetBytes → stored in GitHub
    ///   decode: GitHub returns base64(UTF8.GetBytes(encB64)) → decode → encB64 → decrypt → json
    /// </summary>
    private string? DecryptGitHubFileContent(string githubBase64Content)
    {
        try
        {
            var clean = githubBase64Content.Replace("\r", "").Replace("\n", "");
            logger.LogDebug("DecryptGitHub: raw content length={Len}, first60={Preview}",
                clean.Length, clean[..Math.Min(60, clean.Length)]);

            var bytes = Convert.FromBase64String(clean);
            var encryptedBase64 = Encoding.UTF8.GetString(bytes);
            logger.LogDebug("DecryptGitHub: decoded bytes={ByteLen}, encB64 length={EncLen}, first60={Preview}",
                bytes.Length, encryptedBase64.Length, encryptedBase64[..Math.Min(60, encryptedBase64.Length)]);

            var result = crypto.Decrypt(encryptedBase64);
            if (result is null)
                logger.LogWarning("DecryptGitHub: crypto.Decrypt returned null (key mismatch or corrupted data)");
            return result;
        }
        catch (FormatException ex)
        {
            // Content is not valid base64 — likely already decoded by Octokit
            logger.LogWarning(ex, "DecryptGitHub: content is not valid base64 (length={Len}). Trying direct decrypt...",
                githubBase64Content.Length);
            try
            {
                // Try treating content as already-decoded UTF-8 (the encrypted base64 string itself)
                return crypto.Decrypt(githubBase64Content);
            }
            catch (Exception ex2)
            {
                logger.LogWarning(ex2, "DecryptGitHub: direct decrypt also failed");
                return null;
            }
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Failed to decode/decrypt GitHub file content");
            return null;
        }
    }
}
