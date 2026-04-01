using System.Security.Cryptography;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Microsoft.IdentityModel.JsonWebTokens;
using Microsoft.IdentityModel.Tokens;

namespace GitVault.Infrastructure.GitHub;

/// <summary>
/// Generates short-lived JWTs signed with the GitHub App's RSA private key.
/// These JWTs are exchanged for installation access tokens via GitHub's API.
///
/// The GitHub App private key lives ONLY in server environment variables / secret files.
/// </summary>
public class GitHubAppAuthenticator
{
    private readonly long _appId;
    private readonly RsaSecurityKey _rsaKey;
    private readonly ILogger<GitHubAppAuthenticator> _logger;

    public GitHubAppAuthenticator(IConfiguration configuration, ILogger<GitHubAppAuthenticator> logger)
    {
        _logger = logger;
        _appId = long.Parse(
            configuration["GITHUB_APP_ID"]
            ?? throw new InvalidOperationException("GITHUB_APP_ID is not configured."));

        var rsa = RSA.Create();
        var pemContent = LoadPem(configuration);
        rsa.ImportFromPem(pemContent);
        _rsaKey = new RsaSecurityKey(rsa);
    }

    /// <summary>
    /// Creates a signed JWT valid for 10 minutes.
    /// Used to request installation access tokens from GitHub.
    /// </summary>
    public string CreateAppJwt()
    {
        var now = DateTimeOffset.UtcNow;
        var handler = new JsonWebTokenHandler();

        return handler.CreateToken(new SecurityTokenDescriptor
        {
            Issuer = _appId.ToString(),
            IssuedAt = now.UtcDateTime,
            NotBefore = now.AddSeconds(-60).UtcDateTime, // 60s clock skew tolerance
            Expires = now.AddMinutes(9).UtcDateTime,
            SigningCredentials = new SigningCredentials(_rsaKey, SecurityAlgorithms.RsaSha256)
        });
    }

    private static string LoadPem(IConfiguration configuration)
    {
        // Try inline PEM first (cloud deployments)
        var inline = configuration["GITHUB_APP_PRIVATE_KEY"];
        if (!string.IsNullOrWhiteSpace(inline))
        {
            // Replace literal \n with actual newlines (common in env vars)
            return inline.Replace("\\n", "\n");
        }

        // Fall back to file path
        var path = configuration["GITHUB_APP_PRIVATE_KEY_PATH"]
            ?? throw new InvalidOperationException(
                "GitHub App private key not configured. " +
                "Set GITHUB_APP_PRIVATE_KEY (inline PEM) or GITHUB_APP_PRIVATE_KEY_PATH.");

        if (!File.Exists(path))
            throw new FileNotFoundException($"GitHub App private key file not found: {path}");

        return File.ReadAllText(path);
    }
}
