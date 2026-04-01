using GitVault.Core.Common;
using GitVault.Core.Entities;
using GitVault.Core.Services;
using GitVault.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace GitVault.Infrastructure.Services;

public class AppService(
    GitVaultDbContext db,
    ICryptoService crypto,
    ICacheService cache,
    ILogger<AppService> logger) : IAppService
{
    public async Task<Result<AppClient>> CreateAppAsync(
        string userId, CreateAppRequest request, CancellationToken ct)
    {
        var app = new AppClient
        {
            AppId = Guid.NewGuid().ToString(),
            UserId = userId,
            Name = request.Name,
            Description = request.Description,
            VaultIds = string.Join(',', request.VaultIds),
            Scopes = string.Join(',', request.Scopes),
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        db.Apps.Add(app);
        await db.SaveChangesAsync(ct);
        return Result.Ok(app);
    }

    public async Task<IReadOnlyList<AppClient>> ListAppsAsync(string userId, CancellationToken ct)
    {
        return await db.Apps
            .Where(a => a.UserId == userId)
            .OrderByDescending(a => a.CreatedAt)
            .ToListAsync(ct);
    }

    public async Task<AppClient?> GetAppAsync(string appId, string userId, CancellationToken ct)
    {
        var cacheKey = CacheKeys.App(appId);
        if (cache.TryGet<AppClient>(cacheKey, out var cached)) return cached;

        var app = await db.Apps.FirstOrDefaultAsync(
            a => a.AppId == appId && a.UserId == userId, ct);

        if (app is not null) cache.Set(cacheKey, app, CacheTtl.App);
        return app;
    }

    public async Task<Result<AppClient>> UpdateAppAsync(AppClient app, CancellationToken ct)
    {
        app.UpdatedAt = DateTime.UtcNow;
        db.Apps.Update(app);
        await db.SaveChangesAsync(ct);
        cache.Remove(CacheKeys.App(app.AppId));
        return Result.Ok(app);
    }

    public async Task<Result<bool>> DeactivateAppAsync(string appId, string userId, CancellationToken ct)
    {
        var app = await db.Apps.FirstOrDefaultAsync(
            a => a.AppId == appId && a.UserId == userId, ct);

        if (app is null) return Result.Fail<bool>(ErrorCodes.NotFound, "App not found.");

        app.IsActive = false;
        app.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync(ct);
        cache.Remove(CacheKeys.App(appId));
        return Result.Ok(true);
    }

    public async Task<Result<CreatedCredential>> CreateCredentialAsync(
        string appId, string userId, string? description, DateTime? expiresAt, CancellationToken ct)
    {
        var app = await db.Apps.FirstOrDefaultAsync(
            a => a.AppId == appId && a.UserId == userId, ct);

        if (app is null) return Result.Fail<CreatedCredential>(ErrorCodes.NotFound, "App not found.");
        if (!app.IsActive) return Result.Fail<CreatedCredential>(ErrorCodes.Forbidden, "App is deactivated.");

        var apiKey = crypto.GenerateApiKey();
        var apiSecret = crypto.GenerateApiSecret();
        var secretHash = crypto.HashSecret(apiSecret);

        var credential = new ApiCredential
        {
            CredentialId = Guid.NewGuid().ToString(),
            AppId = appId,
            UserId = userId,
            ApiKey = apiKey,
            ApiSecretHash = secretHash,
            Description = description,
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            ExpiresAt = expiresAt
        };

        db.Credentials.Add(credential);
        await db.SaveChangesAsync(ct);

        logger.LogInformation("Created credential {CredentialId} for app {AppId}", credential.CredentialId, appId);

        // Return the plain secret here — it is NEVER stored and will never be shown again.
        return Result.Ok(new CreatedCredential(credential, apiSecret));
    }

    public async Task<IReadOnlyList<ApiCredential>> ListCredentialsAsync(
        string appId, string userId, CancellationToken ct)
    {
        return await db.Credentials
            .Where(c => c.AppId == appId && c.UserId == userId && c.IsActive)
            .OrderByDescending(c => c.CreatedAt)
            .ToListAsync(ct);
    }

    public async Task<Result<bool>> RevokeCredentialAsync(
        string credentialId, string appId, string userId, CancellationToken ct)
    {
        var cred = await db.Credentials.FirstOrDefaultAsync(
            c => c.CredentialId == credentialId && c.AppId == appId && c.UserId == userId, ct);

        if (cred is null) return Result.Fail<bool>(ErrorCodes.NotFound, "Credential not found.");

        cred.IsActive = false;
        await db.SaveChangesAsync(ct);
        cache.Remove(CacheKeys.Credential(cred.ApiKey));
        return Result.Ok(true);
    }

    public async Task<AppClient?> ValidateCredentialAsync(
        string apiKey, string apiSecret, CancellationToken ct)
    {
        var cacheKey = CacheKeys.Credential(apiKey);

        ApiCredential? cred;
        if (cache.TryGet<ApiCredential>(cacheKey, out var cached))
        {
            cred = cached;
        }
        else
        {
            cred = await db.Credentials
                .Include(c => c.App)
                .FirstOrDefaultAsync(c => c.ApiKey == apiKey && c.IsActive, ct);

            if (cred is not null) cache.Set(cacheKey, cred, CacheTtl.Credential);
        }

        if (cred is null) return null;
        if (cred.ExpiresAt.HasValue && cred.ExpiresAt.Value < DateTime.UtcNow) return null;
        if (!cred.App.IsActive) return null;

        // Verify the secret against the stored bcrypt hash (timing-safe)
        if (!crypto.VerifySecret(apiSecret, cred.ApiSecretHash)) return null;

        // Update last_used_at synchronously before returning — using the same DbContext
        // concurrently via Task.Run causes "second operation started" errors.
        try
        {
            cred.LastUsedAt = DateTime.UtcNow;
            cred.App.LastUsedAt = DateTime.UtcNow;
            await db.SaveChangesAsync(ct);
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Failed to update last_used_at for credential {CredentialId}", cred.CredentialId);
        }

        return cred.App;
    }
}
