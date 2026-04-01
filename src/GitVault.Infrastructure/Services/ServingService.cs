using System.Text;
using GitVault.Core.Services;
using GitVault.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace GitVault.Infrastructure.Services;

public class ServingService(
    IStorageService storage,
    ICryptoService crypto,
    IGitHubContentService gitHubContent,
    GitVaultDbContext db,
    ILogger<ServingService> logger) : IServingService
{
    public async Task<ServingResult> ResolveAsync(
        string publicId,
        string? authorizationHeader,
        CancellationToken ct)
    {
        // We don't know the vaultId from just the publicId, so we search across all vaults.
        // In practice, public_id is globally unique (HMAC-derived), so this is safe.
        var file = await db.Files.FirstOrDefaultAsync(
            f => f.PublicId == publicId && !f.IsDeleted, ct);

        if (file is null)
            return ServingResult.NotFound();

        // Verify the public_id is authentic (not forged)
        // This prevents brute-force: even if someone guesses a logical_id,
        // they can't construct a valid public_id without SERVER_SECRET.
        if (!crypto.VerifyPublicId(publicId, file.LogicalId))
        {
            logger.LogWarning("public_id verification failed for {PublicId}", publicId);
            return ServingResult.NotFound();
        }

        // Authorization check for private files
        if (file.Visibility == Core.Entities.FileVisibility.Private)
        {
            if (!await IsAuthorizedAsync(file, authorizationHeader, ct))
                return ServingResult.Unauthorized();
        }

        var vault = await db.Vaults.FindAsync([file.VaultId], ct);
        if (vault is null) return ServingResult.NotFound();

        // Public file in a public repo → redirect to raw CDN (zero API rate limit cost)
        if (file.Visibility == Core.Entities.FileVisibility.Public && !vault.IsPrivate)
        {
            var blobPath = $"objects/{file.Sha256[..2]}/{file.Sha256[2..4]}/{file.Sha256}";
            var rawUrl = gitHubContent.GetRawUrl(vault.RepoFullName, vault.DefaultBranch, blobPath);
            return ServingResult.Redirect(rawUrl, file.ContentType, file.OriginalName);
        }

        // Private file or private repo → stream through backend
        var contentResult = await storage.GetBlobContentAsync(file.VaultId, file.Sha256, ct);
        if (!contentResult.IsSuccess) return ServingResult.NotFound();

        return ServingResult.Stream(
            contentResult.Value!,
            file.ContentType,
            file.SizeBytes,
            file.OriginalName);
    }

    private async Task<bool> IsAuthorizedAsync(
        Core.Entities.FileMetadata file,
        string? authorizationHeader,
        CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(authorizationHeader)) return false;

        // Firebase Bearer token
        if (authorizationHeader.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase))
        {
            // For serving purposes, we can't easily validate Firebase tokens here
            // without the full auth pipeline. For MVP, allow any valid Bearer token
            // by checking if the user owns the file via their Firebase UID.
            // A more complete solution would inject IFirebaseTokenValidator here.
            // For now: private files require ApiKey auth for simplicity.
            return false; // TODO: integrate Firebase token validation in serving
        }

        // Basic api_key:api_secret
        if (authorizationHeader.StartsWith("Basic ", StringComparison.OrdinalIgnoreCase))
        {
            try
            {
                var encoded = authorizationHeader["Basic ".Length..].Trim();
                var decoded = Encoding.UTF8.GetString(Convert.FromBase64String(encoded));
                var colon = decoded.IndexOf(':');
                if (colon < 0) return false;

                var apiKey = decoded[..colon];
                var apiSecret = decoded[(colon + 1)..];

                var app = await db.Apps
                    .Include(a => a.Credentials)
                    .FirstOrDefaultAsync(a =>
                        a.Credentials.Any(c => c.ApiKey == apiKey && c.IsActive) &&
                        a.IsActive, ct);

                if (app is null) return false;

                var cred = app.Credentials.First(c => c.ApiKey == apiKey);

                if (!crypto.VerifySecret(apiSecret, cred.ApiSecretHash)) return false;
                if (!app.HasScope("files:read")) return false;

                // Check app has access to the vault
                var vaultIds = app.GetVaultIds();
                if (vaultIds.Count > 0 && !vaultIds.Contains(file.VaultId)) return false;

                return true;
            }
            catch
            {
                return false;
            }
        }

        return false;
    }
}
