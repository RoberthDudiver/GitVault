using GitVault.Core.Common;
using GitVault.Core.Services;
using GitVault.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace GitVault.Infrastructure.Services;

public class StorageService(
    GitVaultDbContext db,
    IGitHubContentService gitHubContent,
    ICryptoService crypto,
    ICacheService cache,
    ILogger<StorageService> logger) : IStorageService
{
    public async Task<Result<UploadedBlob>> UploadBlobAsync(
        string vaultId, Stream content, string contentType, CancellationToken ct)
    {
        // 1. Compute SHA-256 (resets stream position after reading)
        var sha256 = crypto.ComputeSha256(content);
        var repoPath = BlobPath(sha256);

        // 2. Deduplication check (cache → GitHub)
        if (await BlobExistsAsync(vaultId, sha256, ct))
        {
            logger.LogDebug("Blob {Sha256} already exists (dedup)", sha256[..12]);
            content.Position = 0;
            var size = content.Length;
            return Result.Ok(new UploadedBlob(sha256, size, contentType, repoPath));
        }

        // 3. Read content bytes (stream was reset by ComputeSha256)
        using var ms = new MemoryStream();
        await content.CopyToAsync(ms, ct);
        var bytes = ms.ToArray();

        var vault = await db.Vaults.FindAsync([vaultId], ct);
        if (vault is null)
            return Result.Fail<UploadedBlob>(ErrorCodes.NotFound, "Vault not found.");

        // 4. Upload blob to GitHub repo at /objects/{ab}/{cd}/{sha256}
        var writeResult = await gitHubContent.WriteFileAsync(
            vault.InstallationId,
            vault.RepoFullName,
            repoPath,
            bytes,
            $"vault: store object {sha256[..12]}",
            ct: ct);

        if (!writeResult.IsSuccess)
            return Result.Fail<UploadedBlob>(writeResult.ErrorCode!, writeResult.ErrorMessage!);

        // 5. Mark blob as existing in cache (immutable — CAS)
        cache.Set(CacheKeys.BlobExists(sha256), true, CacheTtl.BlobExists);

        return Result.Ok(new UploadedBlob(sha256, bytes.Length, contentType, repoPath));
    }

    public async Task<BatchUploadResult> UploadBlobBatchAsync(
        string vaultId,
        IReadOnlyList<BatchUploadItem> items,
        CancellationToken ct)
    {
        var vault = await db.Vaults.FindAsync([vaultId], ct);
        if (vault is null)
            return new BatchUploadResult([], items.Select(i => (i, "Vault not found.")).ToList());

        var succeeded = new List<(BatchUploadItem, UploadedBlob)>();
        var failed = new List<(BatchUploadItem, string)>();
        var batchFiles = new List<(string Path, byte[] Content, BatchUploadItem Item, string Sha256)>();

        // Process each item: hash + dedup check
        foreach (var item in items)
        {
            try
            {
                using var ms = new MemoryStream();
                await item.Content.CopyToAsync(ms, ct);
                var bytes = ms.ToArray();

                using var sha256Stream = new MemoryStream(bytes);
                var sha256 = crypto.ComputeSha256(sha256Stream);
                var path = BlobPath(sha256);

                if (await BlobExistsAsync(vaultId, sha256, ct))
                {
                    // Deduplication hit — no need to upload
                    succeeded.Add((item, new UploadedBlob(sha256, bytes.Length, item.ContentType, path)));
                }
                else
                {
                    batchFiles.Add((path, bytes, item, sha256));
                }
            }
            catch (Exception ex)
            {
                failed.Add((item, ex.Message));
            }
        }

        // Upload all new blobs in a single commit
        if (batchFiles.Count > 0)
        {
            var filesToWrite = batchFiles.Select(f => (f.Path, f.Content)).ToList();
            var batchResult = await gitHubContent.WriteBatchAsync(
                vault.InstallationId,
                vault.RepoFullName,
                vault.DefaultBranch,
                filesToWrite,
                $"vault: store {batchFiles.Count} object(s)",
                ct);

            if (batchResult.IsSuccess)
            {
                foreach (var (path, content, item, sha256) in batchFiles)
                {
                    cache.Set(CacheKeys.BlobExists(sha256), true, CacheTtl.BlobExists);
                    succeeded.Add((item, new UploadedBlob(sha256, content.Length, item.ContentType, path)));
                }
            }
            else
            {
                foreach (var (_, _, item, _) in batchFiles)
                    failed.Add((item, batchResult.ErrorMessage ?? "GitHub write failed"));
            }
        }

        return new BatchUploadResult(succeeded, failed);
    }

    public async Task<bool> BlobExistsAsync(string vaultId, string sha256, CancellationToken ct)
    {
        var cacheKey = CacheKeys.BlobExists(sha256);
        if (cache.TryGet<bool>(cacheKey, out var exists) && exists) return true;

        var vault = await db.Vaults.FindAsync([vaultId], ct);
        if (vault is null) return false;

        var path = BlobPath(sha256);
        var existsInRepo = await gitHubContent.FileExistsAsync(
            vault.InstallationId, vault.RepoFullName, path, ct);

        if (existsInRepo) cache.Set(cacheKey, true, CacheTtl.BlobExists);
        return existsInRepo;
    }

    public async Task<Result<Stream>> GetBlobContentAsync(
        string vaultId, string sha256, CancellationToken ct)
    {
        var vault = await db.Vaults.FindAsync([vaultId], ct);
        if (vault is null)
            return Result.Fail<Stream>(ErrorCodes.NotFound, "Vault not found.");

        var path = BlobPath(sha256);
        var file = await gitHubContent.ReadFileAsync(vault.InstallationId, vault.RepoFullName, path, ct);

        if (file is null)
            return Result.Fail<Stream>(ErrorCodes.NotFound, "Blob not found in repository.");

        var bytes = Convert.FromBase64String(file.Content.Replace("\n", ""));
        return Result.Ok<Stream>(new MemoryStream(bytes));
    }

    private static string BlobPath(string sha256) =>
        $"objects/{sha256[..2]}/{sha256[2..4]}/{sha256}";
}
