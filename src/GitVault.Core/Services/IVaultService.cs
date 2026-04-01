using GitVault.Core.Common;
using GitVault.Core.Entities;

namespace GitVault.Core.Services;

public record GitHubRepoInfo(
    long Id,
    string FullName,
    string Name,
    bool IsPrivate,
    string DefaultBranch,
    string HtmlUrl
);

public interface IVaultService
{
    /// <summary>Lists GitHub repositories accessible via the user's GitHub App installation.</summary>
    Task<Result<IReadOnlyList<GitHubRepoInfo>>> ListAvailableReposAsync(
        string userId,
        CancellationToken ct = default);

    /// <summary>
    /// Connects an existing GitHub repo as a vault and initializes its structure.
    /// Idempotent — safe to call if already initialized.
    /// </summary>
    Task<Result<VaultRepository>> ConnectVaultAsync(
        string userId,
        string repoFullName,
        CancellationToken ct = default);

    /// <summary>Creates a new GitHub repo and initializes it as a vault.</summary>
    Task<Result<VaultRepository>> CreateVaultAsync(
        string userId,
        string repoName,
        bool isPrivate,
        CancellationToken ct = default);

    Task<IReadOnlyList<VaultRepository>> ListVaultsAsync(string userId, CancellationToken ct = default);

    Task<VaultRepository?> GetVaultAsync(string vaultId, string userId, CancellationToken ct = default);
}
