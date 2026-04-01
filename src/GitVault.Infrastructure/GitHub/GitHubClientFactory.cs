using GitVault.Core.Services;
using Microsoft.Extensions.Logging;
using Octokit;

namespace GitVault.Infrastructure.GitHub;

/// <summary>
/// Creates Octokit clients authenticated as a GitHub App installation.
/// Installation tokens are cached for up to 55 minutes (they last 1 hour on GitHub).
/// This is critical to avoid generating a new token on every API request.
/// </summary>
public class GitHubClientFactory(
    GitHubAppAuthenticator authenticator,
    ICacheService cache,
    ILogger<GitHubClientFactory> logger)
{
    private const string ProductName = "GitVault";
    private const string ProductVersion = "1.0";

    /// <summary>
    /// Returns an Octokit client authenticated for the given installation.
    /// Token is cached; a new one is requested from GitHub only when expired.
    /// </summary>
    public async Task<GitHubClient> GetInstallationClientAsync(
        long installationId,
        CancellationToken ct = default)
    {
        var cacheKey = CacheKeys.GitHubInstallationToken(installationId);

        if (cache.TryGet<string>(cacheKey, out var cachedToken) && cachedToken is not null)
        {
            return CreateClient(cachedToken);
        }

        logger.LogDebug("Requesting new installation token for installation {InstallationId}", installationId);

        var appJwt = authenticator.CreateAppJwt();
        var appClient = new GitHubClient(new ProductHeaderValue(ProductName, ProductVersion))
        {
            Credentials = new Credentials(appJwt, AuthenticationType.Bearer)
        };

        var tokenResponse = await appClient.GitHubApps
            .CreateInstallationToken(installationId)
            .WaitAsync(ct);

        var token = tokenResponse.Token;

        // Cache for 55 minutes (tokens expire in 60 min; 5 min safety buffer)
        cache.Set(cacheKey, token, CacheTtl.GitHubToken);

        logger.LogDebug("Cached new installation token for installation {InstallationId}", installationId);

        return CreateClient(token);
    }

    /// <summary>
    /// Returns a client authenticated as the GitHub App itself (not an installation).
    /// Used for listing installations, etc.
    /// </summary>
    public GitHubClient GetAppClient()
    {
        var jwt = authenticator.CreateAppJwt();
        return new GitHubClient(new ProductHeaderValue(ProductName, ProductVersion))
        {
            Credentials = new Credentials(jwt, AuthenticationType.Bearer)
        };
    }

    private static GitHubClient CreateClient(string token) =>
        new(new ProductHeaderValue(ProductName, ProductVersion))
        {
            Credentials = new Credentials(token)
        };
}
