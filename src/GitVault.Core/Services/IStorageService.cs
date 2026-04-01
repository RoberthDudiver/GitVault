using GitVault.Core.Common;

namespace GitVault.Core.Services;

public record UploadedBlob(
    string Sha256,
    long SizeBytes,
    string ContentType,
    string RepoPath
);

public record BatchUploadItem(
    Stream Content,
    string OriginalName,
    string ContentType,
    string? FolderId
);

public record BatchUploadResult(
    IReadOnlyList<(BatchUploadItem Item, UploadedBlob Blob)> Succeeded,
    IReadOnlyList<(BatchUploadItem Item, string Error)> Failed
);

public interface IStorageService
{
    /// <summary>
    /// Uploads a single file blob to the repo (content-addressable).
    /// Returns the stored blob descriptor. Deduplicates by SHA-256.
    /// </summary>
    Task<Result<UploadedBlob>> UploadBlobAsync(
        string vaultId,
        Stream content,
        string contentType,
        CancellationToken ct = default);

    /// <summary>
    /// Uploads multiple blobs in a single Git commit using the Git Data API.
    /// Much more efficient than individual uploads (4 API calls regardless of count).
    /// </summary>
    Task<BatchUploadResult> UploadBlobBatchAsync(
        string vaultId,
        IReadOnlyList<BatchUploadItem> items,
        CancellationToken ct = default);

    /// <summary>
    /// Checks if a blob with the given SHA-256 already exists in the repo.
    /// Checks cache first, then GitHub.
    /// </summary>
    Task<bool> BlobExistsAsync(string vaultId, string sha256, CancellationToken ct = default);

    /// <summary>
    /// Streams blob content. Used for private files (public files redirect to raw CDN).
    /// </summary>
    Task<Result<Stream>> GetBlobContentAsync(
        string vaultId,
        string sha256,
        CancellationToken ct = default);
}
