using GitVault.Core.Common;
using GitVault.Core.Services;
using Microsoft.AspNetCore.Mvc;

namespace GitVault.Api.Controllers;

public class AppsController(IAppService appService) : BaseApiController
{
    /// <summary>Lists all applications (API clients) for the authenticated user.</summary>
    [HttpGet]
    public async Task<IActionResult> List(CancellationToken ct)
    {
        var apps = await appService.ListAppsAsync(CurrentUserId, ct);
        return Ok(new { apps = apps.Select(MapToResponse), count = apps.Count });
    }

    /// <summary>Creates a new application with API access to one or more vaults.</summary>
    /// <remarks>Available scopes: `files:read`, `files:write`. Initial credentials are generated upon creation.</remarks>
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateAppRequest request, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(request.Name))
            return BadRequest(new { error = "VALIDATION", message = "name is required." });

        var result = await appService.CreateAppAsync(CurrentUserId, new(
            request.Name,
            request.Description,
            request.VaultIds ?? [],
            request.Scopes ?? ["files:read"]
        ), ct);

        return FromResult(result);
    }

    /// <summary>Gets application details by ID.</summary>
    [HttpGet("{appId}")]
    public async Task<IActionResult> Get(string appId, CancellationToken ct)
    {
        var app = await appService.GetAppAsync(appId, CurrentUserId, ct);
        if (app is null) return NotFound();
        return Ok(MapToResponse(app));
    }

    /// <summary>Deactivates an application. Its credentials stop working immediately.</summary>
    [HttpDelete("{appId}")]
    public async Task<IActionResult> Deactivate(string appId, CancellationToken ct)
    {
        var result = await appService.DeactivateAppAsync(appId, CurrentUserId, ct);
        if (!result.IsSuccess)
            return result.ErrorCode == ErrorCodes.NotFound
                ? NotFound(new { error = result.ErrorCode, message = result.ErrorMessage })
                : BadRequest(new { error = result.ErrorCode, message = result.ErrorMessage });
        return NoContent();
    }

    // ── Credentials ───────────────────────────────────────────────────────────

    /// <summary>Lists credentials (API keys) for an application. The `api_secret` is never returned here.</summary>
    [HttpGet("{appId}/credentials")]
    public async Task<IActionResult> ListCredentials(string appId, CancellationToken ct)
    {
        var creds = await appService.ListCredentialsAsync(appId, CurrentUserId, ct);
        return Ok(new
        {
            credentials = creds.Select(c => new
            {
                credentialId = c.CredentialId,
                apiKey = c.ApiKey,
                description = c.Description,
                isActive = c.IsActive,
                createdAt = c.CreatedAt,
                expiresAt = c.ExpiresAt,
                lastUsedAt = c.LastUsedAt
                // apiSecret is NEVER returned here — it was shown only at creation
            })
        });
    }

    /// <summary>Generates a new credential pair (api_key + api_secret).</summary>
    /// <remarks>⚠️ The `api_secret` is shown ONLY ONCE in the response. Store it immediately.</remarks>
    [HttpPost("{appId}/credentials")]
    public async Task<IActionResult> CreateCredential(
        string appId,
        [FromBody(EmptyBodyBehavior = Microsoft.AspNetCore.Mvc.ModelBinding.EmptyBodyBehavior.Allow)]
        CreateCredentialRequest? request,
        CancellationToken ct)
    {
        var result = await appService.CreateCredentialAsync(
            appId, CurrentUserId, request?.Description, request?.ExpiresAt, ct);

        if (!result.IsSuccess) return FromResult(result);

        var created = result.Value!;
        return Ok(new
        {
            credentialId = created.Credential.CredentialId,
            apiKey = created.Credential.ApiKey,
            apiSecret = created.PlainSecret,  // ← SHOWN ONLY ONCE. Never stored in plain text.
            description = created.Credential.Description,
            createdAt = created.Credential.CreatedAt,
            warning = "This secret will not be shown again. Store it securely."
        });
    }

    /// <summary>Revokes a credential. Requests using that API key will immediately fail with 401.</summary>
    [HttpDelete("{appId}/credentials/{credentialId}")]
    public async Task<IActionResult> RevokeCredential(
        string appId, string credentialId, CancellationToken ct)
    {
        var result = await appService.RevokeCredentialAsync(credentialId, appId, CurrentUserId, ct);
        if (!result.IsSuccess)
            return result.ErrorCode == ErrorCodes.NotFound
                ? NotFound(new { error = result.ErrorCode, message = result.ErrorMessage })
                : BadRequest(new { error = result.ErrorCode, message = result.ErrorMessage });
        return NoContent();
    }

    private static object MapToResponse(Core.Entities.AppClient a) => new
    {
        appId = a.AppId,
        name = a.Name,
        description = a.Description,
        vaultIds = a.GetVaultIds(),
        scopes = a.GetScopes(),
        isActive = a.IsActive,
        createdAt = a.CreatedAt,
        lastUsedAt = a.LastUsedAt
    };
}

public record CreateAppRequest(
    string Name,
    string? Description,
    IReadOnlyList<string>? VaultIds,
    IReadOnlyList<string>? Scopes
);

public record CreateCredentialRequest(
    string? Description,
    DateTime? ExpiresAt
);
