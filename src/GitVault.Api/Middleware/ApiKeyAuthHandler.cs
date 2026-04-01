using System.Security.Claims;
using System.Text;
using System.Text.Encodings.Web;
using GitVault.Core.Services;
using Microsoft.AspNetCore.Authentication;
using Microsoft.Extensions.Options;

namespace GitVault.Api.Middleware;

public class ApiKeyAuthOptions : AuthenticationSchemeOptions;

/// <summary>
/// Authentication handler for app-to-app API access.
/// Expects: Authorization: Basic base64(api_key:api_secret)
///
/// Security: api_secret is verified against its bcrypt hash.
/// The plain secret is never stored and is only shown to the user once.
/// </summary>
public class ApiKeyAuthHandler(
    IOptionsMonitor<ApiKeyAuthOptions> options,
    ILoggerFactory logger,
    UrlEncoder encoder,
    IAppService appService)
    : AuthenticationHandler<ApiKeyAuthOptions>(options, logger, encoder)
{
    public const string SchemeName = "ApiKey";

    protected override async Task<AuthenticateResult> HandleAuthenticateAsync()
    {
        var authHeader = Request.Headers.Authorization.FirstOrDefault();
        if (authHeader is null || !authHeader.StartsWith("Basic ", StringComparison.OrdinalIgnoreCase))
            return AuthenticateResult.NoResult();

        string apiKey, apiSecret;
        try
        {
            var encoded = authHeader["Basic ".Length..].Trim();
            var decoded = Encoding.UTF8.GetString(Convert.FromBase64String(encoded));
            var colon = decoded.IndexOf(':');
            if (colon < 0) return AuthenticateResult.Fail("Invalid Basic format");
            apiKey = decoded[..colon];
            apiSecret = decoded[(colon + 1)..];
        }
        catch
        {
            return AuthenticateResult.Fail("Malformed Authorization header");
        }

        if (!apiKey.StartsWith("gvk_") || !apiSecret.StartsWith("gvs_"))
            return AuthenticateResult.Fail("Invalid key format");

        var app = await appService.ValidateCredentialAsync(apiKey, apiSecret);
        if (app is null)
            return AuthenticateResult.Fail("Invalid API key or secret");

        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, app.UserId),
            new("app_id", app.AppId),
            new("api_key", apiKey),
            new("scopes", app.Scopes),
        };

        // Expose individual scopes as claims for easy policy checks
        foreach (var scope in app.GetScopes())
            claims.Add(new Claim("scope", scope));

        var identity = new ClaimsIdentity(claims, SchemeName);
        var principal = new ClaimsPrincipal(identity);
        return AuthenticateResult.Success(new AuthenticationTicket(principal, SchemeName));
    }
}
