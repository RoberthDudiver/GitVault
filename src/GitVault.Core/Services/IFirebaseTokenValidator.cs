namespace GitVault.Core.Services;

public record FirebaseTokenClaims(string Uid, string? Email);

public interface IFirebaseTokenValidator
{
    Task<FirebaseTokenClaims?> ValidateAsync(string idToken, CancellationToken ct = default);
}
