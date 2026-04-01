namespace GitVault.Core.Entities;

/// <summary>
/// An "application" created by the user to access GitVault programmatically.
/// Persisted in SQLite and mirrored in /meta/apps/{app_id}.json in the repo.
/// </summary>
public class AppClient
{
    public string AppId { get; set; } = default!;
    public string UserId { get; set; } = default!;
    public string Name { get; set; } = default!;
    public string? Description { get; set; }

    /// <summary>Comma-separated vault IDs this app can access. Empty = all user vaults.</summary>
    public string VaultIds { get; set; } = string.Empty;

    /// <summary>Comma-separated folder IDs. Empty = all folders.</summary>
    public string AllowedFolderIds { get; set; } = string.Empty;

    /// <summary>Comma-separated scopes, e.g. "files:read,files:write".</summary>
    public string Scopes { get; set; } = "files:read";

    public bool IsActive { get; set; } = true;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? LastUsedAt { get; set; }

    // Navigation
    public User User { get; set; } = default!;
    public ICollection<ApiCredential> Credentials { get; set; } = [];

    public IReadOnlyList<string> GetVaultIds() =>
        string.IsNullOrWhiteSpace(VaultIds) ? [] : [.. VaultIds.Split(',')];

    public IReadOnlyList<string> GetScopes() =>
        string.IsNullOrWhiteSpace(Scopes) ? [] : [.. Scopes.Split(',')];

    public bool HasScope(string scope) =>
        GetScopes().Contains(scope, StringComparer.OrdinalIgnoreCase);
}
