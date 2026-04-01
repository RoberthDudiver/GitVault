using System.Security.Claims;

namespace GitVault.Api.Extensions;

public static class ClaimsPrincipalExtensions
{
    public static string UserId(this ClaimsPrincipal principal) =>
        principal.FindFirstValue(ClaimTypes.NameIdentifier)
        ?? throw new InvalidOperationException("User ID claim not found.");

    public static string? TryGetUserId(this ClaimsPrincipal principal) =>
        principal.FindFirstValue(ClaimTypes.NameIdentifier);

    public static string? AppId(this ClaimsPrincipal principal) =>
        principal.FindFirstValue("app_id");

    public static bool HasScope(this ClaimsPrincipal principal, string scope) =>
        principal.FindAll("scope").Any(c =>
            c.Value.Equals(scope, StringComparison.OrdinalIgnoreCase));

    public static bool IsApiKeyAuth(this ClaimsPrincipal principal) =>
        principal.Identity?.AuthenticationType == "ApiKey";

    public static bool IsFirebaseAuth(this ClaimsPrincipal principal) =>
        principal.Identity?.AuthenticationType == "Firebase";
}
