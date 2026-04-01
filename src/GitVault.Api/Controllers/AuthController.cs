using GitVault.Api.Extensions;
using GitVault.Core.Entities;
using GitVault.Core.Services;
using GitVault.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace GitVault.Api.Controllers;

public record LinkInstallationRequest(long InstallationId);

[ApiController]
[Route("v1/auth")]
[Produces("application/json")]
public class AuthController(
    ICryptoService crypto,
    GitVaultDbContext db,
    IConfiguration config) : ControllerBase
{
    /// <summary>
    /// Step 1: returns the GitHub App installation URL with a CSRF-safe state token.
    /// Frontend redirects the user to this URL.
    /// </summary>
    [HttpPost("connect-github")]
    [Authorize(AuthenticationSchemes = "Firebase")]
    public IActionResult StartGitHubConnection()
    {
        var userId = User.UserId();
        var state = crypto.GenerateStateToken(userId);
        var appName = config["GITHUB_APP_NAME"] ?? "gitvault";
        var installUrl =
            $"https://github.com/apps/{appName}/installations/new?state={Uri.EscapeDataString(state)}";

        return Ok(new { installation_url = installUrl });
    }

    /// <summary>
    /// Step 2: GitHub redirects here after the user installs the App.
    /// Saves the installation_id on the user and redirects to the frontend.
    /// </summary>
    [HttpGet("github/callback")]
    [AllowAnonymous]
    public async Task<IActionResult> GitHubCallback(
        [FromQuery] long installation_id,
        [FromQuery] string state,
        CancellationToken ct)
    {
        var userId = crypto.ValidateStateToken(state);
        if (userId is null)
            return BadRequest(new { error = "INVALID_STATE", message = "State token is invalid or expired." });

        var user = await db.Users.FindAsync([userId], ct);
        if (user is null)
            return BadRequest(new { error = "USER_NOT_FOUND" });

        // Persist the installation_id — critical for all subsequent vault operations
        user.GitHubInstallationId = installation_id;
        user.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync(ct);

        var frontendUrl = config["FRONTEND_URL"] ?? "https://gitvault.dudiver.net";
        return Redirect($"{frontendUrl}/onboarding/select-repo?installation_id={installation_id}");
    }

    /// <summary>
    /// Links an existing GitHub App installation to the current user.
    /// Used when the app is already installed and the OAuth callback with state cannot be used.
    /// </summary>
    [HttpPost("github/link-installation")]
    [Authorize(AuthenticationSchemes = "Firebase")]
    public async Task<IActionResult> LinkInstallation(
        [FromBody] LinkInstallationRequest req,
        CancellationToken ct)
    {
        var userId = User.UserId();
        var user = await db.Users.FindAsync([userId], ct);
        if (user is null)
            return BadRequest(new { error = "USER_NOT_FOUND" });

        user.GitHubInstallationId = req.InstallationId;
        user.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync(ct);

        return Ok(new { github_connected = true });
    }

    /// <summary>
    /// Returns the current user profile. Creates the record on first call (auto-provision).
    /// </summary>
    [HttpGet("me")]
    [Authorize(AuthenticationSchemes = "Firebase")]
    public async Task<IActionResult> GetMe(CancellationToken ct)
    {
        var userId = User.UserId();
        var user = await db.Users.FindAsync([userId], ct);

        if (user is null)
        {
            user = new User
            {
                UserId = userId,
                Email = User.FindFirst(System.Security.Claims.ClaimTypes.Email)?.Value ?? "",
                DisplayName = User.FindFirst(System.Security.Claims.ClaimTypes.Name)?.Value,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            db.Users.Add(user);
            await db.SaveChangesAsync(ct);
        }

        var vaults = db.Vaults
            .Where(v => v.UserId == userId)
            .Select(v => new { v.VaultId, v.RepoFullName, v.IsPrivate, v.IsInitialized })
            .ToList();

        return Ok(new
        {
            user_id = user.UserId,
            email = user.Email,
            display_name = user.DisplayName,
            github_login = user.GitHubLogin,
            github_connected = user.GitHubInstallationId.HasValue,
            plan = user.Plan,
            default_vault_id = user.DefaultVaultId,
            vaults
        });
    }
}
