namespace GitVault.Core.Services;

public interface ICryptoService
{
    /// <summary>Computes SHA-256 of stream content. Resets position after reading.</summary>
    string ComputeSha256(Stream content);

    /// <summary>
    /// Derives the public-facing ID for a file.
    /// public_id = BASE62( HMAC-SHA256(logicalId, SERVER_SECRET)[0..11] )
    /// This is a one-way operation without SERVER_SECRET.
    /// </summary>
    string ComputePublicId(string logicalId);

    /// <summary>
    /// Verifies that a public_id was derived from the given logicalId using SERVER_SECRET.
    /// Used during resolution to prevent forged public IDs.
    /// </summary>
    bool VerifyPublicId(string publicId, string logicalId);

    /// <summary>Generates a new API key. Format: "gvk_{16 chars base62}".</summary>
    string GenerateApiKey();

    /// <summary>Generates a new API secret. Format: "gvs_{32 chars base62}".</summary>
    string GenerateApiSecret();

    /// <summary>Hashes an API secret with bcrypt for safe storage.</summary>
    string HashSecret(string secret);

    /// <summary>Verifies a plain secret against a bcrypt hash.</summary>
    bool VerifySecret(string secret, string hash);

    /// <summary>Encodes arbitrary bytes as base62 string.</summary>
    string ToBase62(byte[] bytes);

    /// <summary>Generates a cryptographically random UUID v4.</summary>
    string NewLogicalId();

    /// <summary>Generates a CSRF-safe state token for OAuth flows.</summary>
    string GenerateStateToken(string userId);

    /// <summary>Validates a state token and returns the embedded userId, or null if invalid.</summary>
    string? ValidateStateToken(string token);

    /// <summary>Encrypts plaintext using AES-256-GCM. Returns base64-encoded IV+tag+ciphertext.</summary>
    string Encrypt(string plaintext);

    /// <summary>Decrypts a value produced by Encrypt. Returns null if decryption fails.</summary>
    string? Decrypt(string ciphertext);
}
