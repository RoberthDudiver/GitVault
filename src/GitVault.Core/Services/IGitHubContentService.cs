using GitVault.Core.Common;

namespace GitVault.Core.Services;

public record GitHubFile(
    string Path,
    string Content,   // base64 encoded
    string Sha        // Git blob SHA (not SHA-256 of content)
);

public record GitHubWriteResult(
    string Path,
    string CommitSha
);

public interface IGitHubContentService
{
    /// <summary>Reads a file from the repo. Returns null if not found.</summary>
    Task<GitHubFile?> ReadFileAsync(
        long installationId,
        string repoFullName,
        string path,
        CancellationToken ct = default);

    /// <summary>Checks if a path exists without fetching the full content.</summary>
    Task<bool> FileExistsAsync(
        long installationId,
        string repoFullName,
        string path,
        CancellationToken ct = default);

    /// <summary>
    /// Creates or updates a single file. Pass existingFileSha when updating.
    /// </summary>
    Task<Result<GitHubWriteResult>> WriteFileAsync(
        long installationId,
        string repoFullName,
        string path,
        byte[] content,
        string commitMessage,
        string? existingFileSha = null,
        CancellationToken ct = default);

    /// <summary>
    /// Writes multiple files in a single Git commit using Git Data API.
    /// Much more efficient: 4 API calls regardless of number of files.
    /// </summary>
    Task<Result<string>> WriteBatchAsync(
        long installationId,
        string repoFullName,
        string branch,
        IReadOnlyList<(string Path, byte[] Content)> files,
        string commitMessage,
        CancellationToken ct = default);

    /// <summary>Creates a new repository under the installation account.</summary>
    Task<Result<(long RepoId, string DefaultBranch, string FullName)>> CreateRepositoryAsync(
        long installationId,
        string name,
        bool isPrivate,
        CancellationToken ct = default);

    /// <summary>Gets the raw download URL for a file (raw.githubusercontent.com).</summary>
    string GetRawUrl(string repoFullName, string branch, string path);
}
