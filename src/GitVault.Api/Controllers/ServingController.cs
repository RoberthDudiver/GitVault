using GitVault.Core.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace GitVault.Api.Controllers;

/// <summary>
/// The most important controller in the system.
/// Resolves public_id → actual content or redirect URL.
/// This is the URL users share: GET /f/{public_id}
/// </summary>
[ApiController]
[Route("f")]
[AllowAnonymous]
public class ServingController(IServingService serving) : ControllerBase
{
    /// <summary>
    /// Pretty URL: GET /f/{publicId}/{filename} — filename is decorative only,
    /// the actual file is resolved by publicId. Allows URLs like /f/abc123/foto.jpg
    /// </summary>
    [HttpGet("{publicId}/{filename}")]
    public Task<IActionResult> ServeFileWithName(string publicId, string filename, CancellationToken ct)
        => ServeFile(publicId, ct);

    [HttpGet("{publicId}")]
    public async Task<IActionResult> ServeFile(string publicId, CancellationToken ct)
    {
        var authHeader = Request.Headers.Authorization.FirstOrDefault();
        var result = await serving.ResolveAsync(publicId, authHeader, ct);

        if (!result.Found)
            return NotFound(new { error = "NOT_FOUND", message = "File not found or has been deleted." });

        if (!result.Authorized)
            return Unauthorized(new { error = "UNAUTHORIZED", message = "This file is private. Provide valid credentials." });

        // Public file in a public repo: redirect to raw.githubusercontent.com
        // This uses ZERO GitHub API rate limit — served by GitHub's CDN directly.
        if (result.RedirectUrl is not null)
            return Redirect(result.RedirectUrl);

        // Private file or private repo: stream the content
        if (result.ContentStream is not null)
        {
            Response.Headers.ContentDisposition = $"inline; filename=\"{result.OriginalName}\"";
            return File(result.ContentStream, result.ContentType ?? "application/octet-stream");
        }

        return StatusCode(500, new { error = "INTERNAL_ERROR" });
    }

    [HttpGet("{publicId}/meta")]
    public async Task<IActionResult> GetFileMeta(string publicId, CancellationToken ct)
    {
        var authHeader = Request.Headers.Authorization.FirstOrDefault();
        var result = await serving.ResolveAsync(publicId, authHeader, ct);

        if (!result.Found) return NotFound();
        if (!result.Authorized) return Unauthorized();

        return Ok(new
        {
            original_name = result.OriginalName,
            content_type = result.ContentType,
            content_length = result.ContentLength
        });
    }
}
