namespace GitVault.Core.Services;

public record ServingResult
{
    public bool Found { get; init; }
    public bool Authorized { get; init; }

    /// <summary>
    /// Set for public files in public repos — client should redirect here.
    /// Pointing to raw.githubusercontent.com avoids consuming GitHub API rate limit.
    /// </summary>
    public string? RedirectUrl { get; init; }

    /// <summary>Set for private files or private repos. Backend streams the content.</summary>
    public Stream? ContentStream { get; init; }
    public string? ContentType { get; init; }
    public long? ContentLength { get; init; }
    public string? OriginalName { get; init; }

    public static ServingResult NotFound() => new() { Found = false };
    public static ServingResult Unauthorized() => new() { Found = true, Authorized = false };
    public static ServingResult Redirect(string url, string contentType, string originalName) =>
        new() { Found = true, Authorized = true, RedirectUrl = url, ContentType = contentType, OriginalName = originalName };
    public static ServingResult Stream(System.IO.Stream stream, string contentType, long? length, string originalName) =>
        new() { Found = true, Authorized = true, ContentStream = stream, ContentType = contentType, ContentLength = length, OriginalName = originalName };
}

public interface IServingService
{
    /// <summary>
    /// Resolves a public_id to actual file content or a redirect URL.
    /// Handles auth checking for private files.
    /// </summary>
    Task<ServingResult> ResolveAsync(
        string publicId,
        string? authorizationHeader,
        CancellationToken ct = default);
}
