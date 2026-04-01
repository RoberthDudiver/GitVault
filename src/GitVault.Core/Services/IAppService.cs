using GitVault.Core.Common;
using GitVault.Core.Entities;

namespace GitVault.Core.Services;

public record CreateAppRequest(
    string Name,
    string? Description,
    IReadOnlyList<string> VaultIds,
    IReadOnlyList<string> Scopes
);

public record CreatedCredential(
    ApiCredential Credential,
    string PlainSecret  // shown ONCE, never stored
);

public interface IAppService
{
    Task<Result<AppClient>> CreateAppAsync(string userId, CreateAppRequest request, CancellationToken ct = default);
    Task<IReadOnlyList<AppClient>> ListAppsAsync(string userId, CancellationToken ct = default);
    Task<AppClient?> GetAppAsync(string appId, string userId, CancellationToken ct = default);
    Task<Result<AppClient>> UpdateAppAsync(AppClient app, CancellationToken ct = default);
    Task<Result<bool>> DeactivateAppAsync(string appId, string userId, CancellationToken ct = default);

    Task<Result<CreatedCredential>> CreateCredentialAsync(
        string appId,
        string userId,
        string? description,
        DateTime? expiresAt,
        CancellationToken ct = default);

    Task<IReadOnlyList<ApiCredential>> ListCredentialsAsync(string appId, string userId, CancellationToken ct = default);

    Task<Result<bool>> RevokeCredentialAsync(
        string credentialId,
        string appId,
        string userId,
        CancellationToken ct = default);

    /// <summary>
    /// Validates an api_key + api_secret pair.
    /// Returns the matching AppClient if valid, null otherwise.
    /// Updates last_used_at in the background.
    /// </summary>
    Task<AppClient?> ValidateCredentialAsync(string apiKey, string apiSecret, CancellationToken ct = default);
}
