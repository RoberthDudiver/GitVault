namespace GitVault.Core.Entities;

/// <summary>
/// Represents a GitHub repository connected as a storage vault.
/// Persisted in SQLite for fast lookups. The repo itself holds the file index.
/// </summary>
public class VaultRepository
{
    public string VaultId { get; set; } = default!;
    public string UserId { get; set; } = default!;
    public long InstallationId { get; set; }
    public string RepoFullName { get; set; } = default!;
    public long RepoId { get; set; }
    public bool IsPrivate { get; set; }
    public string DefaultBranch { get; set; } = "main";
    public bool IsInitialized { get; set; }
    public long StorageUsedBytes { get; set; }
    public int FileCount { get; set; }

    /// <summary>
    /// 4-character base62 code embedded in every publicId for this vault.
    /// Enables routing without any per-file SQLite record.
    /// Example: publicId = "a7fZ" + "Xk9mRq2pLnBt" (shortCode + hmac)
    /// </summary>
    public string ShortCode { get; set; } = string.Empty;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation
    public User User { get; set; } = default!;
}
