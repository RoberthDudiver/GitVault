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

    /// <summary>Retorna la configuración del usuario: si tiene GitHub App instalada y si tiene PAT configurado.</summary>
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

    /// <summary>Guarda o reemplaza el Personal Access Token de GitHub del usuario.</summary>
    /// <remarks>El token se encripta con AES-256-GCM antes de persistirse. Nunca se devuelve en texto plano.</remarks>
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

    /// <summary>Elimina el Personal Access Token de GitHub guardado.</summary>
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
