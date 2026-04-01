using System.Security.Claims;
using System.Text.Encodings.Web;
using FirebaseAdmin.Auth;
using Microsoft.AspNetCore.Authentication;
using Microsoft.Extensions.Options;

namespace GitVault.Api.Middleware;

public class FirebaseAuthOptions : AuthenticationSchemeOptions;

/// <summary>
/// ASP.NET Core authentication handler that validates Firebase ID tokens.
/// Populates ClaimsPrincipal with uid, email and display name.
/// </summary>
public class FirebaseAuthHandler(
    IOptionsMonitor<FirebaseAuthOptions> options,
    ILoggerFactory logger,
    UrlEncoder encoder)
    : AuthenticationHandler<FirebaseAuthOptions>(options, logger, encoder)
{
    public const string SchemeName = "Firebase";

    protected override async Task<AuthenticateResult> HandleAuthenticateAsync()
    {
        var authHeader = Request.Headers.Authorization.FirstOrDefault();
        if (authHeader is null || !authHeader.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase))
            return AuthenticateResult.NoResult();

        var idToken = authHeader["Bearer ".Length..].Trim();
        if (string.IsNullOrEmpty(idToken))
            return AuthenticateResult.Fail("Empty token");

        try
        {
            var decoded = await FirebaseAuth.DefaultInstance.VerifyIdTokenAsync(idToken);

            var claims = new List<Claim>
            {
                new(ClaimTypes.NameIdentifier, decoded.Uid),
                new("firebase_uid", decoded.Uid),
            };

            if (decoded.Claims.TryGetValue("email", out var email))
                claims.Add(new Claim(ClaimTypes.Email, email.ToString()!));

            if (decoded.Claims.TryGetValue("name", out var name))
                claims.Add(new Claim(ClaimTypes.Name, name.ToString()!));

            var identity = new ClaimsIdentity(claims, SchemeName);
            var principal = new ClaimsPrincipal(identity);
            var ticket = new AuthenticationTicket(principal, SchemeName);

            return AuthenticateResult.Success(ticket);
        }
        catch (FirebaseAuthException ex)
        {
            return AuthenticateResult.Fail($"Invalid Firebase token: {ex.Message}");
        }
    }
}
