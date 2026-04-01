using System.Security.Claims;
using System.Text.Encodings.Web;
using FirebaseAdmin.Auth;
using GitVault.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authentication;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace GitVault.Api.Middleware;

public class FirebaseAuthOptions : AuthenticationSchemeOptions;

public class FirebaseAuthHandler(
    IOptionsMonitor<FirebaseAuthOptions> options,
    ILoggerFactory logger,
    UrlEncoder encoder,
    IServiceScopeFactory scopeFactory)
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

            // Check if user is blocked
            await using var scope = scopeFactory.CreateAsyncScope();
            var db = scope.ServiceProvider.GetRequiredService<GitVaultDbContext>();
            var user = await db.Users.AsNoTracking()
                .FirstOrDefaultAsync(u => u.UserId == decoded.Uid);
            if (user?.IsBlocked == true)
                return AuthenticateResult.Fail("Account is blocked.");

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
