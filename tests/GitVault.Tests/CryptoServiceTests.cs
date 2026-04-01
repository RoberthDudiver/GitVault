using FluentAssertions;
using GitVault.Infrastructure.Crypto;
using Microsoft.Extensions.Configuration;

namespace GitVault.Tests;

/// <summary>
/// Tests for CryptoService — the root of trust.
/// These tests verify the security properties of the system:
/// - public_id cannot be reversed without SERVER_SECRET
/// - public_id for the same logical_id is deterministic
/// - different secrets produce different public_ids
/// - bcrypt hashing and verification works correctly
/// - base62 encoding is correct
/// </summary>
public class CryptoServiceTests
{
    private readonly CryptoService _sut;
    private const string TestSecret = "test-secret-32-chars-for-unit-tests!!";

    public CryptoServiceTests()
    {
        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                { "SERVER_SECRET", TestSecret }
            })
            .Build();
        _sut = new CryptoService(config);
    }

    // ── public_id ─────────────────────────────────────────────────────────────

    [Fact]
    public void ComputePublicId_SameInput_ReturnsSameId()
    {
        var logicalId = Guid.NewGuid().ToString();
        var id1 = _sut.ComputePublicId(logicalId);
        var id2 = _sut.ComputePublicId(logicalId);
        id1.Should().Be(id2);
    }

    [Fact]
    public void ComputePublicId_DifferentInputs_ReturnsDifferentIds()
    {
        var id1 = _sut.ComputePublicId(Guid.NewGuid().ToString());
        var id2 = _sut.ComputePublicId(Guid.NewGuid().ToString());
        id1.Should().NotBe(id2);
    }

    [Fact]
    public void ComputePublicId_DifferentSecret_ReturnsDifferentId()
    {
        var logicalId = Guid.NewGuid().ToString();
        var publicId1 = _sut.ComputePublicId(logicalId);

        // Create a second instance with a different secret
        var config2 = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                { "SERVER_SECRET", "completely-different-secret-xyz!!" }
            })
            .Build();
        var sut2 = new CryptoService(config2);
        var publicId2 = sut2.ComputePublicId(logicalId);

        publicId1.Should().NotBe(publicId2,
            "the same logical_id should produce different public_ids with different SERVER_SECRETs");
    }

    [Fact]
    public void VerifyPublicId_ValidPair_ReturnsTrue()
    {
        var logicalId = Guid.NewGuid().ToString();
        var publicId = _sut.ComputePublicId(logicalId);
        _sut.VerifyPublicId(publicId, logicalId).Should().BeTrue();
    }

    [Fact]
    public void VerifyPublicId_WrongLogicalId_ReturnsFalse()
    {
        var logicalId = Guid.NewGuid().ToString();
        var publicId = _sut.ComputePublicId(logicalId);
        _sut.VerifyPublicId(publicId, Guid.NewGuid().ToString()).Should().BeFalse();
    }

    [Fact]
    public void VerifyPublicId_TamperedPublicId_ReturnsFalse()
    {
        var logicalId = Guid.NewGuid().ToString();
        var publicId = _sut.ComputePublicId(logicalId);
        var tampered = publicId[..^1] + (publicId[^1] == 'A' ? 'B' : 'A');
        _sut.VerifyPublicId(tampered, logicalId).Should().BeFalse();
    }

    // ── SHA-256 ───────────────────────────────────────────────────────────────

    [Fact]
    public void ComputeSha256_SameContent_ReturnsSameHash()
    {
        var content = "hello world"u8.ToArray();
        var h1 = _sut.ComputeSha256(new MemoryStream(content));
        var h2 = _sut.ComputeSha256(new MemoryStream(content));
        h1.Should().Be(h2);
    }

    [Fact]
    public void ComputeSha256_KnownValue_MatchesExpected()
    {
        // SHA-256("") = e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855
        var hash = _sut.ComputeSha256(new MemoryStream([]));
        hash.Should().Be("e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855");
    }

    [Fact]
    public void ComputeSha256_ResetsStreamPosition()
    {
        var stream = new MemoryStream("test"u8.ToArray());
        _sut.ComputeSha256(stream);
        stream.Position.Should().Be(0, "stream position should be reset after hashing");
    }

    // ── API Key / Secret ──────────────────────────────────────────────────────

    [Fact]
    public void GenerateApiKey_HasCorrectFormat()
    {
        var key = _sut.GenerateApiKey();
        key.Should().StartWith("gvk_");
        key.Length.Should().BeGreaterThan(10);
    }

    [Fact]
    public void GenerateApiSecret_HasCorrectFormat()
    {
        var secret = _sut.GenerateApiSecret();
        secret.Should().StartWith("gvs_");
        secret.Length.Should().BeGreaterThan(10);
    }

    [Fact]
    public void GenerateApiKey_IsUnique()
    {
        var keys = Enumerable.Range(0, 100).Select(_ => _sut.GenerateApiKey()).ToList();
        keys.Distinct().Should().HaveCount(100, "all generated keys should be unique");
    }

    [Fact]
    public void HashSecret_AndVerify_Works()
    {
        var secret = _sut.GenerateApiSecret();
        var hash = _sut.HashSecret(secret);

        _sut.VerifySecret(secret, hash).Should().BeTrue();
        _sut.VerifySecret("wrong-secret", hash).Should().BeFalse();
    }

    // ── State tokens ──────────────────────────────────────────────────────────

    [Fact]
    public void StateToken_RoundTrip_ReturnsUserId()
    {
        var userId = "firebase-uid-123";
        var token = _sut.GenerateStateToken(userId);
        var decoded = _sut.ValidateStateToken(token);
        decoded.Should().Be(userId);
    }

    [Fact]
    public void StateToken_TamperedToken_ReturnsNull()
    {
        var token = _sut.GenerateStateToken("user-1");
        var tampered = token[..^3] + "XYZ";
        _sut.ValidateStateToken(tampered).Should().BeNull();
    }

    [Fact]
    public void StateToken_WrongSecret_ReturnsNull()
    {
        var token = _sut.GenerateStateToken("user-1");

        var config2 = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                { "SERVER_SECRET", "completely-different-secret-xyz!!" }
            })
            .Build();
        var sut2 = new CryptoService(config2);

        sut2.ValidateStateToken(token).Should().BeNull();
    }

    // ── Base62 ────────────────────────────────────────────────────────────────

    [Fact]
    public void ToBase62_NonEmpty_ReturnsNonEmpty()
    {
        var bytes = new byte[] { 0xFF, 0xAB, 0x12 };
        var result = _sut.ToBase62(bytes);
        result.Should().NotBeNullOrEmpty();
        result.Should().MatchRegex("^[0-9A-Za-z]+$", "base62 should only contain alphanumeric characters");
    }

    [Fact]
    public void ToBase62_SameInput_ReturnsSameOutput()
    {
        var bytes = new byte[] { 1, 2, 3, 4, 5 };
        _sut.ToBase62(bytes).Should().Be(_sut.ToBase62(bytes));
    }
}
