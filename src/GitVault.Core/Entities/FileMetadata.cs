namespace GitVault.Core.Entities;

/// <summary>
/// Logical file record. Stored encrypted in the vault repo at meta/{publicId}.
/// NOT persisted in SQLite — GitHub is the source of truth.
/// </summary>
public class FileMetadata
{
    public string LogicalId { get; set; } = default!;
    public string PublicId { get; set; } = default!;
    public string UserId { get; set; } = default!;
    public string VaultId { get; set; } = default!;
    public string? FolderId { get; set; }
    public string OriginalName { get; set; } = default!;
    public string ContentType { get; set; } = default!;
    public long SizeBytes { get; set; }
    public string Sha256 { get; set; } = default!;
    public FileVisibility Visibility { get; set; } = FileVisibility.Public;
    public bool IsDeleted { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? DeletedAt { get; set; }
}

public enum FileVisibility
{
    Public,
    Private
}
