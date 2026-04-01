namespace GitVault.Core.Entities;

/// <summary>
/// API key + secret pair for an AppClient.
/// The secret is NEVER stored in plain text — only its bcrypt hash.
/// The plain secret is shown to the user exactly once at creation time.
/// </summary>
public class ApiCredential
{
    public string CredentialId { get; set; } = default!;
    public string AppId { get; set; } = default!;
    public string UserId { get; set; } = default!;

    /// <summary>Public key identifier. Format: "gvk_{16 chars base62}".</summary>
    public string ApiKey { get; set; } = default!;

    /// <summary>bcrypt hash of the api_secret. The plain secret is never stored.</summary>
    public string ApiSecretHash { get; set; } = default!;

    public string? Description { get; set; }
    public bool IsActive { get; set; } = true;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? ExpiresAt { get; set; }
    public DateTime? LastUsedAt { get; set; }

    // Navigation
    public AppClient App { get; set; } = default!;
}
