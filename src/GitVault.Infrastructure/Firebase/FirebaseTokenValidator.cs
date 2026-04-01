using FirebaseAdmin.Auth;
using GitVault.Core.Services;
using Microsoft.Extensions.Logging;

namespace GitVault.Infrastructure.Firebase;

public class FirebaseTokenValidator(ILogger<FirebaseTokenValidator> logger) : IFirebaseTokenValidator
{
    public async Task<FirebaseTokenClaims?> ValidateAsync(string idToken, CancellationToken ct = default)
    {
        try
        {
            var decoded = await FirebaseAuth.DefaultInstance.VerifyIdTokenAsync(idToken, ct);
            decoded.Claims.TryGetValue("email", out var email);
            return new FirebaseTokenClaims(decoded.Uid, email?.ToString());
        }
        catch (FirebaseAuthException ex)
        {
            logger.LogDebug("Firebase token validation failed: {Message}", ex.Message);
            return null;
        }
    }
}
