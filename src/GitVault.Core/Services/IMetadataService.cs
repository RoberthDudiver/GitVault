using GitVault.Core.Common;
using GitVault.Core.Entities;

namespace GitVault.Core.Services;

public interface IMetadataService
{
    // ── File metadata ─────────────────────────────────────────────────────────

    Task<Result<FileMetadata>> CreateFileMetadataAsync(FileMetadata metadata, CancellationToken ct = default);

    /// <summary>Resolves by public_id (used in serving). Checks cache, then repo index.</summary>
    Task<FileMetadata?> GetByPublicIdAsync(string vaultId, string publicId, CancellationToken ct = default);

    Task<FileMetadata?> GetByLogicalIdAsync(string vaultId, string logicalId, CancellationToken ct = default);

    Task<(IReadOnlyList<FileMetadata> Items, int Total)> ListFilesAsync(
        string vaultId,
        string? folderId,
        int page,
        int pageSize,
        CancellationToken ct = default);

    Task<Result<FileMetadata>> UpdateFileAsync(FileMetadata metadata, CancellationToken ct = default);

    Task<Result<bool>> SoftDeleteFileAsync(string vaultId, string logicalId, CancellationToken ct = default);

    // ── Folder metadata ───────────────────────────────────────────────────────

    Task<Result<FolderMetadata>> CreateFolderAsync(FolderMetadata folder, CancellationToken ct = default);

    Task<FolderMetadata?> GetFolderAsync(string vaultId, string folderId, CancellationToken ct = default);

    Task<IReadOnlyList<FolderMetadata>> ListFoldersAsync(
        string vaultId,
        string? parentFolderId,
        CancellationToken ct = default);

    Task<Result<FolderMetadata>> UpdateFolderAsync(FolderMetadata folder, CancellationToken ct = default);
}
