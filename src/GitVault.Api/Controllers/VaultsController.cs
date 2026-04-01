using GitVault.Api.Controllers;
using GitVault.Core.Services;
using Microsoft.AspNetCore.Mvc;

namespace GitVault.Api.Controllers;

public class VaultsController(IVaultService vaultService) : BaseApiController
{
    /// <summary>Lists all vaults for the authenticated user.</summary>
    [HttpGet]
    public async Task<IActionResult> List(CancellationToken ct)
    {
        var vaults = await vaultService.ListVaultsAsync(CurrentUserId, ct);
        return Ok(new { vaults, count = vaults.Count });
    }

    /// <summary>Lists available GitHub repositories that can be connected as a vault.</summary>
    /// <remarks>Requires the user to have the GitHub App installed. If not installed, returns 400 with GITHUB_NOT_CONNECTED error.</remarks>
    [HttpGet("available-repos")]
    public async Task<IActionResult> ListAvailableRepos(CancellationToken ct)
    {
        var result = await vaultService.ListAvailableReposAsync(CurrentUserId, ct);
        return FromResult(result);
    }

    /// <summary>Connects an existing repository as a vault or creates a new one.</summary>
    /// <remarks>
    /// If `create_if_not_exists` is true, creates the repository on GitHub and initializes it.
    /// If false, connects an already existing repository.
    /// Requires GitHub App installed or a Personal Access Token configured.
    /// </remarks>
    [HttpPost]
    public async Task<IActionResult> Connect([FromBody] ConnectVaultRequest request, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(request.RepoFullName))
            return BadRequest(new { error = "VALIDATION", message = "repo_full_name is required." });

        var result = request.CreateIfNotExists
            ? await vaultService.CreateVaultAsync(CurrentUserId, request.RepoFullName, request.IsPrivate, ct)
            : await vaultService.ConnectVaultAsync(CurrentUserId, request.RepoFullName, ct);

        return FromResult(result);
    }

    /// <summary>Gets vault details by ID.</summary>
    [HttpGet("{vaultId}")]
    public async Task<IActionResult> Get(string vaultId, CancellationToken ct)
    {
        var vault = await vaultService.GetVaultAsync(vaultId, CurrentUserId, ct);
        if (vault is null) return NotFound();
        return Ok(vault);
    }
}

public record ConnectVaultRequest(
    string RepoFullName,
    bool CreateIfNotExists = false,
    bool IsPrivate = true
);
