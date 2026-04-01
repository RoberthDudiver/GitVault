using GitVault.Api.Controllers;
using GitVault.Core.Services;
using Microsoft.AspNetCore.Mvc;

namespace GitVault.Api.Controllers;

public class VaultsController(IVaultService vaultService) : BaseApiController
{
    [HttpGet]
    public async Task<IActionResult> List(CancellationToken ct)
    {
        var vaults = await vaultService.ListVaultsAsync(CurrentUserId, ct);
        return Ok(new { vaults, count = vaults.Count });
    }

    [HttpGet("available-repos")]
    public async Task<IActionResult> ListAvailableRepos(CancellationToken ct)
    {
        var result = await vaultService.ListAvailableReposAsync(CurrentUserId, ct);
        return FromResult(result);
    }

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
