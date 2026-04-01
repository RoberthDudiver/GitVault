using GitVault.Core.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SixLabors.ImageSharp;
using SixLabors.ImageSharp.Processing;

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

    /// <summary>
    /// Returns a JPEG thumbnail (max 400×400) of the file.
    /// Only works for image files; returns 415 for non-images.
    /// Result is heavily cached (immutable content).
    /// </summary>
    [HttpGet("{publicId}/thumb")]
    public async Task<IActionResult> GetThumbnail(string publicId, CancellationToken ct)
    {
        var authHeader = Request.Headers.Authorization.FirstOrDefault();
        var result = await serving.ResolveAsync(publicId, authHeader, ct);

        if (!result.Found) return NotFound();
        if (!result.Authorized) return Unauthorized();

        // For public files in public repos the serving result is a redirect URL.
        // We need the actual bytes, so stream them regardless of visibility.
        Stream? contentStream = result.ContentStream;

        if (contentStream is null && result.RedirectUrl is not null)
        {
            // Fetch from the CDN redirect URL so we can resize it
            using var http = new System.Net.Http.HttpClient();
            try
            {
                var bytes = await http.GetByteArrayAsync(result.RedirectUrl, ct);
                contentStream = new MemoryStream(bytes);
            }
            catch
            {
                return StatusCode(502, new { error = "UPSTREAM_ERROR" });
            }
        }

        if (contentStream is null)
            return StatusCode(500, new { error = "INTERNAL_ERROR" });

        // Only image types support thumbnail generation
        var contentType = result.ContentType ?? "";
        if (!contentType.StartsWith("image/", StringComparison.OrdinalIgnoreCase))
            return StatusCode(415, new { error = "NOT_AN_IMAGE" });

        try
        {
            using var image = await Image.LoadAsync(contentStream, ct);
            image.Mutate(x => x.Resize(new ResizeOptions
            {
                Size = new Size(400, 400),
                Mode = ResizeMode.Max   // maintain aspect ratio, never upscale beyond original
            }));

            var ms = new MemoryStream();
            await image.SaveAsJpegAsync(ms, ct);
            ms.Position = 0;

            // Thumbnails are derived from immutable CAS blobs — cache aggressively
            Response.Headers.CacheControl = "public, max-age=31536000, immutable";
            return File(ms, "image/jpeg");
        }
        catch
        {
            return StatusCode(422, new { error = "CANNOT_PROCESS_IMAGE" });
        }
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
