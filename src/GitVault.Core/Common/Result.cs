namespace GitVault.Core.Common;

public class Result<T>
{
    public T? Value { get; init; }
    public bool IsSuccess { get; init; }
    public string? ErrorCode { get; init; }
    public string? ErrorMessage { get; init; }

    public static Result<T> Ok(T value) =>
        new() { Value = value, IsSuccess = true };

    public static Result<T> Fail(string code, string message) =>
        new() { IsSuccess = false, ErrorCode = code, ErrorMessage = message };
}

public static class Result
{
    public static Result<T> Ok<T>(T value) => Result<T>.Ok(value);
    public static Result<T> Fail<T>(string code, string message) => Result<T>.Fail(code, message);
}

public static class ErrorCodes
{
    public const string NotFound = "NOT_FOUND";
    public const string Unauthorized = "UNAUTHORIZED";
    public const string Forbidden = "FORBIDDEN";
    public const string Conflict = "CONFLICT";
    public const string RateLimitExceeded = "RATE_LIMIT_EXCEEDED";
    public const string GitHubError = "GITHUB_ERROR";
    public const string FileTooLarge = "FILE_TOO_LARGE";
    public const string UnsupportedContentType = "UNSUPPORTED_CONTENT_TYPE";
    public const string InvalidPublicId = "INVALID_PUBLIC_ID";
    public const string InvalidCredentials = "INVALID_CREDENTIALS";
    public const string VaultNotInitialized = "VAULT_NOT_INITIALIZED";
    public const string InternalError = "INTERNAL_ERROR";
}
