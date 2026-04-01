namespace GitVault.Core.Entities;

/// <summary>
/// Logical file record. Lives in the user's repo at /meta/files/{ab}/{cd}/{logical_id}.json
/// and is cached in SQLite for fast resolution.
/// </summary>
public class FileMetadata
{
    /// <summary>UUID v4 — internal identifier, stored in the repo index.</summary>
    public string LogicalId { get; set; } = default!;

    /// <summary>
    /// HMAC-SHA256(logical_id, SERVER_SECRET)[0:12] encoded as base62.
    /// This appears in public URLs. Cannot be reversed without SERVER_SECRET.
    /// </summary>
    public string PublicId { get; set; } = default!;

    public string UserId { get; set; } = default!;
    public string VaultId { get; set; } = default!;
    public string? FolderId { get; set; }

    /// <summary>Original filename provided by the user.</summary>
    public string OriginalName { get; set; } = default!;
    public string ContentType { get; set; } = default!;
    public long SizeBytes { get; set; }

    /// <summary>SHA-256 of the file content — points to the physical blob in /objects/.</summary>
    public string Sha256 { get; set; } = default!;

    public FileVisibility Visibility { get; set; } = FileVisibility.Public;
    public bool IsDeleted { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? DeletedAt { get; set; }

    // Navigation
    public VaultRepository Vault { get; set; } = default!;
}

public enum FileVisibility
{
    Public,
    Private
}
