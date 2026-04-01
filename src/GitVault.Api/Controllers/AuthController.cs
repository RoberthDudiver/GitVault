using GitVault.Api.Extensions;
using GitVault.Core.Entities;
using GitVault.Core.Services;
using GitVault.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace GitVault.Api.Controllers;

[ApiController]
[Route("v1/auth")]
[Produces("application/json")]
public class AuthController(
    ICryptoService crypto,
    GitVaultDbContext db,
    IConfiguration config) : ControllerBase
{
    [HttpPost("connect-github")]
    [Authorize(AuthenticationSchemes = "Firebase")]
    public IActionResult StartGitHubConnection()
    {
        var userId = User.UserId();
        var state = crypto.GenerateStateToken(userId);
        var appName = config["GITHUB_APP_NAME"] ?? "gitvault";

        var installUrl = $"https://github.com/apps/{appName}/installations/new?state={Uri.EscapeDataString(state)}";

        return Ok(new { installation_url = installUrl });
    }

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

        // Persist the installation_id on the user record
        var user = await db.Users.FindAsync([userId], ct);
        if (user is null)
            return BadRequest(new { error = "USER_NOT_FOUND" });

        // Store installation_id on user (one user → one installation for MVP)
        // For a more complete model, store in a separate GitHubInstallation table.
        // Here we keep it simple: embedded in the user for the initial flow.
        user.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync(ct);

        // Store installation_id in a temporary in-memory structure or re-query later.
        // For MVP: return it to the frontend so it can store it in the session.
        var frontendUrl = config["FRONTEND_URL"] ?? "http://localhost:3000";
        return Redirect($"{frontendUrl}/onboarding/select-repo?installation_id={installation_id}");
    }

    [HttpGet("me")]
    [Authorize(AuthenticationSchemes = "Firebase")]
    public async Task<IActionResult> GetMe(CancellationToken ct)
    {
        var userId = User.UserId();
        var user = await db.Users.FindAsync([userId], ct);

        if (user is null)
        {
            // First-time login: auto-create the user record
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
            plan = user.Plan,
            default_vault_id = user.DefaultVaultId,
            vaults
        });
    }
}
