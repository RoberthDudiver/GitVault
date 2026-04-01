using GitVault.Core.Common;
using GitVault.Core.Services;
using Microsoft.AspNetCore.Mvc;

namespace GitVault.Api.Controllers;

public class AppsController(IAppService appService) : BaseApiController
{
    [HttpGet]
    public async Task<IActionResult> List(CancellationToken ct)
    {
        var apps = await appService.ListAppsAsync(CurrentUserId, ct);
        return Ok(new { apps = apps.Select(MapToResponse), count = apps.Count });
    }

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

    [HttpGet("{appId}")]
    public async Task<IActionResult> Get(string appId, CancellationToken ct)
    {
        var app = await appService.GetAppAsync(appId, CurrentUserId, ct);
        if (app is null) return NotFound();
        return Ok(MapToResponse(app));
    }

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

    [HttpGet("{appId}/credentials")]
    public async Task<IActionResult> ListCredentials(string appId, CancellationToken ct)
    {
        var creds = await appService.ListCredentialsAsync(appId, CurrentUserId, ct);
        return Ok(new
        {
            credentials = creds.Select(c => new
            {
                credential_id = c.CredentialId,
                api_key = c.ApiKey,
                description = c.Description,
                is_active = c.IsActive,
                created_at = c.CreatedAt,
                expires_at = c.ExpiresAt,
                last_used_at = c.LastUsedAt
                // api_secret is NEVER returned here — it was shown only at creation
            })
        });
    }

    [HttpPost("{appId}/credentials")]
    public async Task<IActionResult> CreateCredential(
        string appId,
        [FromBody] CreateCredentialRequest request,
        CancellationToken ct)
    {
        var result = await appService.CreateCredentialAsync(
            appId, CurrentUserId, request.Description, request.ExpiresAt, ct);

        if (!result.IsSuccess) return FromResult(result);

        var created = result.Value!;
        return Ok(new
        {
            credential_id = created.Credential.CredentialId,
            api_key = created.Credential.ApiKey,
            api_secret = created.PlainSecret,  // ← SHOWN ONLY ONCE. Never stored in plain text.
            description = created.Credential.Description,
            created_at = created.Credential.CreatedAt,
            warning = "This secret will not be shown again. Store it securely."
        });
    }

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
        app_id = a.AppId,
        name = a.Name,
        description = a.Description,
        vault_ids = a.GetVaultIds(),
        scopes = a.GetScopes(),
        is_active = a.IsActive,
        created_at = a.CreatedAt,
        last_used_at = a.LastUsedAt
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
