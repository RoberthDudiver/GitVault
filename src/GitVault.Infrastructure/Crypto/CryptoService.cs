using System.Security.Cryptography;
using System.Text;
using GitVault.Core.Services;
using Microsoft.Extensions.Configuration;

namespace GitVault.Infrastructure.Crypto;

/// <summary>
/// Root of trust for GitVault's security model.
///
/// Security properties:
///   - public_id = BASE62( HMAC-SHA256(logicalId, SERVER_SECRET)[0..11] )
///   - SERVER_SECRET lives ONLY in server environment variables.
///   - The algorithm is public (open source). Security depends solely on SERVER_SECRET.
///   - A DLL/SDK can include this code freely — without SERVER_SECRET it is useless.
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

        // Derive a 256-bit AES key from SERVER_SECRET using HKDF-SHA256
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

    // ── Public ID (HMAC-based) ────────────────────────────────────────────────

    public string ComputePublicId(string logicalId)
    {
        var inputBytes = Encoding.UTF8.GetBytes(logicalId);
        var hmac = HMACSHA256.HashData(_serverSecretBytes, inputBytes);
        // Take first 12 bytes → ~16 base62 chars (96 bits of entropy)
        return ToBase62(hmac[..12]);
    }

    public bool VerifyPublicId(string publicId, string logicalId)
    {
        var expected = ComputePublicId(logicalId);
        // Constant-time comparison to avoid timing attacks
        return CryptographicOperations.FixedTimeEquals(
            Encoding.UTF8.GetBytes(publicId),
            Encoding.UTF8.GetBytes(expected));
    }

    // ── API Key & Secret generation ───────────────────────────────────────────

    public string GenerateApiKey()
    {
        var bytes = RandomNumberGenerator.GetBytes(12); // 96 bits
        return "gvk_" + ToBase62(bytes);
    }

    public string GenerateApiSecret()
    {
        var bytes = RandomNumberGenerator.GetBytes(24); // 192 bits
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
        // state = base64url( userId:timestamp:hmac )
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

            // Reject tokens older than 10 minutes
            var age = DateTimeOffset.UtcNow.ToUnixTimeSeconds() - timestamp;
            if (age > 600) return null;

            // Verify HMAC
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
        var nonce = RandomNumberGenerator.GetBytes(AesGcm.NonceByteSizes.MaxSize); // 12 bytes
        var tag = new byte[AesGcm.TagByteSizes.MaxSize];                            // 16 bytes
        var plaintextBytes = Encoding.UTF8.GetBytes(plaintext);
        var ciphertext = new byte[plaintextBytes.Length];

        using var aes = new AesGcm(_aesKey, AesGcm.TagByteSizes.MaxSize);
        aes.Encrypt(nonce, plaintextBytes, ciphertext, tag);

        // Layout: nonce(12) + tag(16) + ciphertext(n)
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

        // Treat bytes as a big-endian unsigned integer and divide by 62
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
}
