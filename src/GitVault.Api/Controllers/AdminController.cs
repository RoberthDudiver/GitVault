using FirebaseAdmin.Auth;
using GitVault.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace GitVault.Api.Controllers;

[ApiController]
[Route("v1/admin")]
[AllowAnonymous]
[Produces("application/json")]
public class AdminController(
    GitVaultDbContext db,
    IConfiguration config,
    ILogger<AdminController> logger) : ControllerBase
{
    private bool IsAuthorized()
    {
        var secret = config["ADMIN_SECRET"];
        if (string.IsNullOrWhiteSpace(secret)) return false;
        var header = Request.Headers["X-Admin-Secret"].FirstOrDefault();
        return header == secret;
    }

    [HttpGet("users")]
    public async Task<IActionResult> ListUsers(CancellationToken ct)
    {
        if (!IsAuthorized()) return Unauthorized(new { error = "UNAUTHORIZED" });

        var users = await db.Users
            .OrderByDescending(u => u.CreatedAt)
            .Select(u => new
            {
                u.UserId,
                u.Email,
                u.DisplayName,
                u.GitHubLogin,
                u.Plan,
                u.IsBlocked,
                u.GitHubInstallationId,
                u.CreatedAt,
                u.UpdatedAt,
                VaultCount = db.Vaults.Count(v => v.UserId == u.UserId)
            })
            .ToListAsync(ct);

        return Ok(new { users, count = users.Count });
    }

    [HttpDelete("users/{userId}")]
    public async Task<IActionResult> DeleteUser(string userId, CancellationToken ct)
    {
        if (!IsAuthorized()) return Unauthorized(new { error = "UNAUTHORIZED" });

        var user = await db.Users.FindAsync([userId], ct);
        if (user is null) return NotFound(new { error = "USER_NOT_FOUND" });

        // Delete from Firebase Auth so the user cannot log back in
        try
        {
            await FirebaseAuth.DefaultInstance.DeleteUserAsync(userId, ct);
        }
        catch (FirebaseAuthException ex) when (ex.AuthErrorCode == AuthErrorCode.UserNotFound)
        {
            // Already deleted from Firebase — continue with DB cleanup
            logger.LogWarning("User {UserId} not found in Firebase (already deleted?)", userId);
        }

        db.Users.Remove(user); // Cascade deletes vaults, files, apps, credentials
        await db.SaveChangesAsync(ct);

        logger.LogWarning("Admin deleted user {UserId} ({Email}) from DB and Firebase", userId, user.Email);
        return Ok(new { deleted = true, userId });
    }

    [HttpPost("users/{userId}/block")]
    public async Task<IActionResult> BlockUser(string userId, CancellationToken ct)
    {
        if (!IsAuthorized()) return Unauthorized(new { error = "UNAUTHORIZED" });

        var user = await db.Users.FindAsync([userId], ct);
        if (user is null) return NotFound(new { error = "USER_NOT_FOUND" });

        user.IsBlocked = true;
        user.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync(ct);

        logger.LogWarning("Admin blocked user {UserId} ({Email})", userId, user.Email);
        return Ok(new { blocked = true, userId });
    }

    [HttpPost("users/{userId}/unblock")]
    public async Task<IActionResult> UnblockUser(string userId, CancellationToken ct)
    {
        if (!IsAuthorized()) return Unauthorized(new { error = "UNAUTHORIZED" });

        var user = await db.Users.FindAsync([userId], ct);
        if (user is null) return NotFound(new { error = "USER_NOT_FOUND" });

        user.IsBlocked = false;
        user.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync(ct);

        logger.LogInformation("Admin unblocked user {UserId} ({Email})", userId, user.Email);
        return Ok(new { blocked = false, userId });
    }
}
