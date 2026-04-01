namespace GitVault.Core.Entities;

/// <summary>
/// Represents a GitHub repository connected as a storage vault.
/// Persisted in SQLite for fast lookups. The repo itself holds the file index.
/// </summary>
public class VaultRepository
{
    public string VaultId { get; set; } = default!;          // UUID v4
    public string UserId { get; set; } = default!;           // Firebase UID
    public long InstallationId { get; set; }                  // GitHub App installation
    public string RepoFullName { get; set; } = default!;      // "owner/repo"
    public long RepoId { get; set; }                          // GitHub repo ID
    public bool IsPrivate { get; set; }
    public string DefaultBranch { get; set; } = "main";
    public bool IsInitialized { get; set; }
    public long StorageUsedBytes { get; set; }
    public int FileCount { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation
    public User User { get; set; } = default!;
}
