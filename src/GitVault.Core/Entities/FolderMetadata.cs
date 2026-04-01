namespace GitVault.Core.Entities;

/// <summary>
/// Logical folder. Folders are virtual — they don't correspond to physical
/// directories in the repo. Structure in repo: /meta/folders/{folder_id}.json
/// </summary>
public class FolderMetadata
{
    public string FolderId { get; set; } = default!;
    public string UserId { get; set; } = default!;
    public string VaultId { get; set; } = default!;
    public string? ParentFolderId { get; set; }
    public string Name { get; set; } = default!;

    /// <summary>Normalized slug (lowercase, hyphens). Used in logical paths.</summary>
    public string Slug { get; set; } = default!;

    /// <summary>Full logical path, e.g. "/photos/travel". Denormalized for display.</summary>
    public string Path { get; set; } = default!;

    public FileVisibility Visibility { get; set; } = FileVisibility.Public;
    public int FileCount { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation
    public VaultRepository Vault { get; set; } = default!;
}
