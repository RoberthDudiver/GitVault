namespace GitVault.Core.Entities;

/// <summary>
/// Persisted in SQLite. Identity comes from Firebase Auth (uid is the PK).
/// </summary>
public class User
{
    public string UserId { get; set; } = default!;       // Firebase UID
    public string Email { get; set; } = default!;
    public string? DisplayName { get; set; }
    public long? GitHubUserId { get; set; }
    public string? GitHubLogin { get; set; }
    public string Plan { get; set; } = "free";
    /// <summary>
    /// GitHub App installation ID for this user.
    /// Set when the user installs the GitHub App (callback or webhook).
    /// Required before any vault operation.
    /// </summary>
    public long? GitHubInstallationId { get; set; }
    public string? DefaultVaultId { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
