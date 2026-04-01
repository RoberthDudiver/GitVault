using GitVault.Api.Extensions;
using GitVault.Core.Services;
using GitVault.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace GitVault.Api.Controllers;

public record SetGitHubTokenRequest(string Token);

[ApiController]
[Route("v1/settings")]
[Authorize(AuthenticationSchemes = "Firebase")]
[Produces("application/json")]
public class SettingsController(
    GitVaultDbContext db,
    ICryptoService crypto) : ControllerBase
{
    private string UserId => User.UserId();

    /// <summary>Returns user settings: whether they have the GitHub App installed and a PAT configured.</summary>
    [HttpGet]
    public async Task<IActionResult> GetSettings(CancellationToken ct)
    {
        var user = await db.Users.FindAsync([UserId], ct);
        if (user is null) return NotFound();

        return Ok(new
        {
            has_github_token = !string.IsNullOrEmpty(user.GitHubPersonalTokenEncrypted)
        });
    }

    /// <summary>Saves or replaces the user's GitHub Personal Access Token.</summary>
    /// <remarks>The token is encrypted with AES-256-GCM before being persisted. Never returned in plain text.</remarks>
    [HttpPut("github-token")]
    public async Task<IActionResult> SetGitHubToken(
        [FromBody] SetGitHubTokenRequest req,
        CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(req.Token))
            return BadRequest(new { error = "VALIDATION", message = "Token cannot be empty." });

        var user = await db.Users.FindAsync([UserId], ct);
        if (user is null) return NotFound();

        user.GitHubPersonalTokenEncrypted = crypto.Encrypt(req.Token.Trim());
        user.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync(ct);

        return Ok(new { has_github_token = true });
    }

    /// <summary>Removes the saved GitHub Personal Access Token.</summary>
    [HttpDelete("github-token")]
    public async Task<IActionResult> RemoveGitHubToken(CancellationToken ct)
    {
        var user = await db.Users.FindAsync([UserId], ct);
        if (user is null) return NotFound();

        user.GitHubPersonalTokenEncrypted = null;
        user.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync(ct);

        return Ok(new { has_github_token = false });
    }
}
