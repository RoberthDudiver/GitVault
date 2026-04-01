using System.Security.Cryptography;
using System.Text;
using GitVault.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace GitVault.Api.Controllers;

/// <summary>
/// Receives GitHub App webhook events.
/// Webhook URL: http://api.gitvault.dudiver.net/webhooks/github
///
/// Events handled:
///   - installation         → guardar/actualizar installation_id vinculado al usuario
///   - installation_repositories → actualizar lista de repos disponibles
/// </summary>
[ApiController]
[Route("webhooks")]
[AllowAnonymous]
public class WebhookController(
    GitVaultDbContext db,
    IConfiguration config,
    ILogger<WebhookController> logger) : ControllerBase
{
    [HttpPost("github")]
    public async Task<IActionResult> GitHub(CancellationToken ct)
    {
        // 1. Verify HMAC-SHA256 signature from GitHub
        if (!await VerifySignatureAsync())
        {
            logger.LogWarning("GitHub webhook: invalid signature from {Ip}", HttpContext.Connection.RemoteIpAddress);
            return Unauthorized();
        }

        var eventType = Request.Headers["X-GitHub-Event"].FirstOrDefault();
        var body = await ReadBodyAsync();

        logger.LogInformation("GitHub webhook event: {Event}", eventType);

        using var doc = System.Text.Json.JsonDocument.Parse(body);
        var root = doc.RootElement;

        switch (eventType)
        {
            case "installation":
                await HandleInstallationAsync(root, ct);
                break;

            case "installation_repositories":
                await HandleInstallationRepositoriesAsync(root, ct);
                break;

            case "ping":
                logger.LogInformation("GitHub App ping — zen: {Zen}",
                    root.TryGetProperty("zen", out var zen) ? zen.GetString() : "?");
                break;

            default:
                logger.LogDebug("Unhandled webhook event: {Event}", eventType);
                break;
        }

        return Ok();
    }

    // ── Event handlers ────────────────────────────────────────────────────────

    private async Task HandleInstallationAsync(
        System.Text.Json.JsonElement root, CancellationToken ct)
    {
        var action = root.TryGetProperty("action", out var a) ? a.GetString() : null;
        var installationId = root
            .GetProperty("installation")
            .GetProperty("id")
            .GetInt64();

        var senderLogin = root
            .TryGetProperty("sender", out var sender)
            ? sender.GetProperty("login").GetString()
            : null;

        var senderId = root
            .TryGetProperty("sender", out var senderEl)
            ? senderEl.GetProperty("id").GetInt64()
            : (long?)null;

        logger.LogInformation(
            "Installation event: action={Action}, installation_id={Id}, sender={Sender}",
            action, installationId, senderLogin);

        // When action = "created": link the installation_id to the matching user
        if (action == "created" && senderId.HasValue)
        {
            var user = await db.Users.FirstOrDefaultAsync(
                u => u.GitHubUserId == senderId.Value, ct);

            if (user is not null)
            {
                user.GitHubInstallationId = installationId;
                user.GitHubLogin = senderLogin;
                user.UpdatedAt = DateTime.UtcNow;

                // Keep existing vaults in sync
                var vaults = await db.Vaults
                    .Where(v => v.UserId == user.UserId)
                    .ToListAsync(ct);
                foreach (var vault in vaults)
                    vault.InstallationId = installationId;

                await db.SaveChangesAsync(ct);
                logger.LogInformation(
                    "Linked installation {Id} to user {UserId} ({Login})",
                    installationId, user.UserId, senderLogin);
            }
        }

        // When action = "deleted" or "suspend": clear the installation from the user and mark vaults unavailable
        if (action is "deleted" or "suspend")
        {
            // Clear GitHubInstallationId from the user so github_connected returns false
            var user = await db.Users.FirstOrDefaultAsync(
                u => u.GitHubInstallationId == installationId, ct);

            if (user is not null)
            {
                user.GitHubInstallationId = null;
                user.UpdatedAt = DateTime.UtcNow;
                logger.LogInformation(
                    "Cleared GitHubInstallationId for user {UserId} after installation {Action}",
                    user.UserId, action);
            }

            var vaults = await db.Vaults
                .Where(v => v.InstallationId == installationId)
                .ToListAsync(ct);

            foreach (var vault in vaults)
                vault.IsInitialized = false;

            await db.SaveChangesAsync(ct);
            logger.LogWarning(
                "Installation {Id} {Action}d — {Count} vault(s) affected",
                installationId, action, vaults.Count);
        }
    }

    private Task HandleInstallationRepositoriesAsync(
        System.Text.Json.JsonElement root, CancellationToken ct)
    {
        // For MVP: just log. In v2, maintain a local cache of repo access.
        var action = root.TryGetProperty("action", out var a) ? a.GetString() : null;
        logger.LogInformation("Installation repositories event: action={Action}", action);
        return Task.CompletedTask;
    }

    // ── Signature verification ────────────────────────────────────────────────

    private string _cachedBody = string.Empty;

    private async Task<string> ReadBodyAsync()
    {
        if (!string.IsNullOrEmpty(_cachedBody)) return _cachedBody;
        Request.EnableBuffering();
        using var reader = new StreamReader(Request.Body, Encoding.UTF8, leaveOpen: true);
        _cachedBody = await reader.ReadToEndAsync();
        Request.Body.Position = 0;
        return _cachedBody;
    }

    private async Task<bool> VerifySignatureAsync()
    {
        var webhookSecret = config["GITHUB_WEBHOOK_SECRET"];
        if (string.IsNullOrWhiteSpace(webhookSecret))
        {
            logger.LogError("GITHUB_WEBHOOK_SECRET is not configured.");
            return false;
        }

        var signature = Request.Headers["X-Hub-Signature-256"].FirstOrDefault();
        if (string.IsNullOrEmpty(signature) || !signature.StartsWith("sha256="))
            return false;

        var body = await ReadBodyAsync();
        var secretBytes = Encoding.UTF8.GetBytes(webhookSecret);
        var bodyBytes = Encoding.UTF8.GetBytes(body);
        var expectedHash = HMACSHA256.HashData(secretBytes, bodyBytes);
        var expectedSignature = "sha256=" + Convert.ToHexString(expectedHash).ToLowerInvariant();

        return CryptographicOperations.FixedTimeEquals(
            Encoding.UTF8.GetBytes(signature),
            Encoding.UTF8.GetBytes(expectedSignature));
    }
}
