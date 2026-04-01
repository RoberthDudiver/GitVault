using GitVault.Api.Controllers;
using GitVault.Core.Services;
using Microsoft.AspNetCore.Mvc;

namespace GitVault.Api.Controllers;

public class VaultsController(IVaultService vaultService) : BaseApiController
{
    /// <summary>Lista todos los vaults del usuario autenticado.</summary>
    [HttpGet]
    public async Task<IActionResult> List(CancellationToken ct)
    {
        var vaults = await vaultService.ListVaultsAsync(CurrentUserId, ct);
        return Ok(new { vaults, count = vaults.Count });
    }

    /// <summary>Lista los repositorios de GitHub disponibles para conectar como vault.</summary>
    /// <remarks>Requiere que el usuario tenga la GitHub App instalada. Si no hay instalación, retorna 400 con error GITHUB_NOT_CONNECTED.</remarks>
    [HttpGet("available-repos")]
    public async Task<IActionResult> ListAvailableRepos(CancellationToken ct)
    {
        var result = await vaultService.ListAvailableReposAsync(CurrentUserId, ct);
        return FromResult(result);
    }

    /// <summary>Conecta un repositorio existente como vault o crea uno nuevo.</summary>
    /// <remarks>
    /// Si `create_if_not_exists` es true, crea el repo en GitHub y lo inicializa.
    /// Si es false, conecta un repo ya existente.
    /// Requiere GitHub App instalada o Personal Access Token configurado.
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

    /// <summary>Obtiene los detalles de un vault por su ID.</summary>
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
