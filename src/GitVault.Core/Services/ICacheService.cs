namespace GitVault.Core.Services;

public interface ICacheService
{
    T? Get<T>(string key);
    void Set<T>(string key, T value, TimeSpan ttl);
    void Remove(string key);
    bool TryGet<T>(string key, out T? value);

    // Negative cache helpers
    void SetNotFound(string key, TimeSpan? ttl = null);
    bool IsNotFound(string key);
}

/// <summary>Centralised cache key constants to avoid typos and duplication.</summary>
public static class CacheKeys
{
    // File resolution
    public static string FileByPublicId(string publicId) => $"file:pub:{publicId}";
    public static string FileByLogicalId(string logicalId) => $"file:lid:{logicalId}";
    public static string FileNotFound(string publicId) => $"file:pub:nf:{publicId}";

    // Blob existence (immutable — CAS blobs never disappear)
    public static string BlobExists(string sha256) => $"blob:{sha256}";

    // Folders
    public static string Folder(string folderId) => $"folder:{folderId}";
    public static string FolderList(string vaultId, string? parentId) =>
        $"folders:{vaultId}:{parentId ?? "root"}";
    public static string FolderNotFound(string folderId) => $"folder:nf:{folderId}";

    // Vault
    public static string Vault(string vaultId) => $"vault:{vaultId}";

    // App & credentials
    public static string App(string appId) => $"app:{appId}";
    public static string Credential(string apiKey) => $"cred:{apiKey}";

    // GitHub App installation tokens
    public static string GitHubInstallationToken(long installationId) => $"gh:token:{installationId}";

    // Rate limit tracking
    public static string GitHubRateLimit(long installationId) => $"gh:rl:{installationId}";
    public static string ApiRateLimit(string identifier) => $"rl:api:{identifier}";
}

/// <summary>TTL constants in one place.</summary>
public static class CacheTtl
{
    public static readonly TimeSpan FileMetadata = TimeSpan.FromHours(1);
    public static readonly TimeSpan BlobExists = TimeSpan.FromHours(2);   // Blobs are immutable
    public static readonly TimeSpan Folder = TimeSpan.FromHours(1);
    public static readonly TimeSpan Vault = TimeSpan.FromHours(1);
    public static readonly TimeSpan App = TimeSpan.FromMinutes(30);
    public static readonly TimeSpan Credential = TimeSpan.FromMinutes(30);
    public static readonly TimeSpan GitHubToken = TimeSpan.FromMinutes(55); // GH tokens last 1h
    public static readonly TimeSpan NotFound = TimeSpan.FromMinutes(15);
}
