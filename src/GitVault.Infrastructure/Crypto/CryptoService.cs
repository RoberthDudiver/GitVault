using System.Security.Cryptography;
using System.Text;
using GitVault.Core.Services;
using Microsoft.Extensions.Configuration;

namespace GitVault.Infrastructure.Crypto;

/// <summary>
/// Root of trust for GitVault's security model.
///
/// Security properties:
///   - public_id = vaultShortCode(4) + BASE62_FIXED( HMAC-SHA256(logicalId, SERVER_SECRET)[0..9], 12 )
///   - SERVER_SECRET lives ONLY in server environment variables.
///   - The first 4 chars of a public_id identify the vault (no file-table lookup needed).
///   - The last 12 chars are HMAC-derived — unforgeable without SERVER_SECRET.
/// </summary>
public class CryptoService : ICryptoService
{
    private readonly byte[] _serverSecretBytes;
    private readonly byte[] _aesKey;
    private const string Base62Chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

    public CryptoService(IConfiguration configuration)
    {
        var secret = configuration["SERVER_SECRET"]
            ?? throw new InvalidOperationException(
                "SERVER_SECRET is not configured. " +
                "Set it via environment variable or appsettings. " +
                "Generate with: openssl rand -hex 32");

        _serverSecretBytes = Encoding.UTF8.GetBytes(secret);

        _aesKey = HKDF.DeriveKey(HashAlgorithmName.SHA256, _serverSecretBytes, 32,
            info: "GitVault-AES-PAT-v1"u8.ToArray());
    }

    // ── SHA-256 ───────────────────────────────────────────────────────────────

    public string ComputeSha256(Stream content)
    {
        var originalPosition = content.CanSeek ? content.Position : -1;
        var hash = SHA256.HashData(content);
        if (originalPosition >= 0) content.Position = originalPosition;
        return Convert.ToHexString(hash).ToLowerInvariant();
    }

    // ── Public ID (vault-scoped HMAC) ─────────────────────────────────────────

    public string ComputePublicId(string logicalId, string vaultShortCode)
    {
        var inputBytes = Encoding.UTF8.GetBytes(logicalId);
        var hmac = HMACSHA256.HashData(_serverSecretBytes, inputBytes);
        // Embed vault short code (4 chars) + HMAC-derived suffix (12 chars) = 16 chars total
        return vaultShortCode + ToBase62Fixed(hmac[..9], 12);
    }

    public string ExtractVaultShortCode(string publicId)
        => publicId.Length >= 4 ? publicId[..4] : string.Empty;

    public bool VerifyPublicId(string publicId, string logicalId)
    {
        if (publicId.Length < 4) return false;
        var shortCode = publicId[..4];
        var expected = ComputePublicId(logicalId, shortCode);
        return CryptographicOperations.FixedTimeEquals(
            Encoding.UTF8.GetBytes(publicId),
            Encoding.UTF8.GetBytes(expected));
    }

    public string GenerateVaultShortCode()
    {
        // 3 bytes = 24 bits → base62 → pad/trim to exactly 4 chars
        var bytes = RandomNumberGenerator.GetBytes(3);
        return ToBase62Fixed(bytes, 4);
    }

    // ── API Key & Secret generation ───────────────────────────────────────────

    public string GenerateApiKey()
    {
        var bytes = RandomNumberGenerator.GetBytes(12);
        return "gvk_" + ToBase62(bytes);
    }

    public string GenerateApiSecret()
    {
        var bytes = RandomNumberGenerator.GetBytes(24);
        return "gvs_" + ToBase62(bytes);
    }

    public string HashSecret(string secret) =>
        BCrypt.Net.BCrypt.HashPassword(secret, workFactor: 12);

    public bool VerifySecret(string secret, string hash) =>
        BCrypt.Net.BCrypt.Verify(secret, hash);

    // ── Logical ID ────────────────────────────────────────────────────────────

    public string NewLogicalId() => Guid.NewGuid().ToString();

    // ── State tokens for OAuth CSRF protection ────────────────────────────────

    public string GenerateStateToken(string userId)
    {
        var timestamp = DateTimeOffset.UtcNow.ToUnixTimeSeconds();
        var payload = $"{userId}:{timestamp}";
        var payloadBytes = Encoding.UTF8.GetBytes(payload);
        var hmac = HMACSHA256.HashData(_serverSecretBytes, payloadBytes);
        var full = $"{payload}:{Convert.ToBase64String(hmac)}";
        return Convert.ToBase64String(Encoding.UTF8.GetBytes(full))
            .Replace('+', '-').Replace('/', '_').TrimEnd('=');
    }

    public string? ValidateStateToken(string token)
    {
        try
        {
            var padded = token.Replace('-', '+').Replace('_', '/');
            var remainder = padded.Length % 4;
            if (remainder > 0) padded += new string('=', 4 - remainder);

            var decoded = Encoding.UTF8.GetString(Convert.FromBase64String(padded));
            var parts = decoded.Split(':');
            if (parts.Length != 3) return null;

            var userId = parts[0];
            var timestamp = long.Parse(parts[1]);
            var providedHmac = parts[2];

            var age = DateTimeOffset.UtcNow.ToUnixTimeSeconds() - timestamp;
            if (age > 600) return null;

            var payload = $"{userId}:{timestamp}";
            var expected = Convert.ToBase64String(
                HMACSHA256.HashData(_serverSecretBytes, Encoding.UTF8.GetBytes(payload)));

            if (!CryptographicOperations.FixedTimeEquals(
                Encoding.UTF8.GetBytes(providedHmac),
                Encoding.UTF8.GetBytes(expected)))
                return null;

            return userId;
        }
        catch
        {
            return null;
        }
    }

    // ── AES-256-GCM Encrypt / Decrypt ─────────────────────────────────────────

    public string Encrypt(string plaintext)
    {
        var nonce = RandomNumberGenerator.GetBytes(AesGcm.NonceByteSizes.MaxSize);
        var tag = new byte[AesGcm.TagByteSizes.MaxSize];
        var plaintextBytes = Encoding.UTF8.GetBytes(plaintext);
        var ciphertext = new byte[plaintextBytes.Length];

        using var aes = new AesGcm(_aesKey, AesGcm.TagByteSizes.MaxSize);
        aes.Encrypt(nonce, plaintextBytes, ciphertext, tag);

        var combined = new byte[nonce.Length + tag.Length + ciphertext.Length];
        nonce.CopyTo(combined, 0);
        tag.CopyTo(combined, nonce.Length);
        ciphertext.CopyTo(combined, nonce.Length + tag.Length);

        return Convert.ToBase64String(combined);
    }

    public string? Decrypt(string encrypted)
    {
        try
        {
            var combined = Convert.FromBase64String(encrypted);
            const int nonceSize = 12;
            const int tagSize = 16;
            if (combined.Length < nonceSize + tagSize) return null;

            var nonce = combined[..nonceSize];
            var tag = combined[nonceSize..(nonceSize + tagSize)];
            var ciphertext = combined[(nonceSize + tagSize)..];
            var plaintext = new byte[ciphertext.Length];

            using var aes = new AesGcm(_aesKey, AesGcm.TagByteSizes.MaxSize);
            aes.Decrypt(nonce, ciphertext, tag, plaintext);

            return Encoding.UTF8.GetString(plaintext);
        }
        catch
        {
            return null;
        }
    }

    // ── Base62 ────────────────────────────────────────────────────────────────

    public string ToBase62(byte[] bytes)
    {
        if (bytes.Length == 0) return string.Empty;
        var result = new System.Text.StringBuilder();
        var value = new System.Numerics.BigInteger(bytes, isUnsigned: true, isBigEndian: true);
        var base62 = new System.Numerics.BigInteger(62);

        while (value > 0)
        {
            value = System.Numerics.BigInteger.DivRem(value, base62, out var remainder);
            result.Insert(0, Base62Chars[(int)remainder]);
        }

        return result.Length == 0 ? "0" : result.ToString();
    }

    /// <summary>
    /// Encodes bytes as exactly <paramref name="length"/> base62 characters.
    /// Extracts digits from LSB (right-to-left), discarding excess high-order bits.
    /// Guarantees a constant-length output regardless of leading zero bytes.
    /// </summary>
    private static string ToBase62Fixed(byte[] bytes, int length)
    {
        var result = new char[length];
        var value = new System.Numerics.BigInteger(bytes, isUnsigned: true, isBigEndian: true);
        var base62 = new System.Numerics.BigInteger(62);
        const string chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

        for (var i = length - 1; i >= 0; i--)
        {
            value = System.Numerics.BigInteger.DivRem(value, base62, out var rem);
            result[i] = chars[(int)rem];
        }

        return new string(result);
    }
}
