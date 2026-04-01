using GitVault.Core.Entities;
using GitVault.Core.Services;
using Microsoft.AspNetCore.Mvc;

namespace GitVault.Api.Controllers;

[Route("v1/vaults/{vaultId}/folders")]
public class FoldersController(
    IMetadataService metadata,
    IVaultService vaultService) : BaseApiController
{
    /// <summary>Lista las carpetas de un vault, opcionalmente filtradas por carpeta padre.</summary>
    [HttpGet]
    public async Task<IActionResult> List(
        string vaultId,
        [FromQuery] string? parentId,
        CancellationToken ct)
    {
        if (!await CanAccessVault(vaultId, ct)) return Forbid();

        var folders = await metadata.ListFoldersAsync(vaultId, parentId, ct);
        return Ok(new { folders = folders.Select(MapToResponse), total = folders.Count });
    }

    /// <summary>Crea una carpeta dentro de un vault.</summary>
    [HttpPost]
    public async Task<IActionResult> Create(
        string vaultId,
        [FromBody] CreateFolderRequest request,
        CancellationToken ct)
    {
        if (!await CanAccessVault(vaultId, ct)) return Forbid();
        if (string.IsNullOrWhiteSpace(request.Name))
            return BadRequest(new { error = "VALIDATION", message = "name is required." });

        var slug = request.Name.ToLowerInvariant()
            .Replace(' ', '-')
            .Replace('_', '-');

        var folder = new FolderMetadata
        {
            FolderId = Guid.NewGuid().ToString(),
            UserId = CurrentUserId,
            VaultId = vaultId,
            ParentFolderId = request.ParentId,
            Name = request.Name,
            Slug = slug,
            Path = request.ParentId is null ? $"/{slug}" : $"/{slug}",
            Visibility = Enum.TryParse<FileVisibility>(request.Visibility, true, out var v)
                ? v : FileVisibility.Public
        };

        var result = await metadata.CreateFolderAsync(folder, ct);
        return FromResult(result);
    }

    /// <summary>Obtiene los detalles de una carpeta por su ID.</summary>
    [HttpGet("{folderId}")]
    public async Task<IActionResult> Get(string vaultId, string folderId, CancellationToken ct)
    {
        if (!await CanAccessVault(vaultId, ct)) return Forbid();
        var folder = await metadata.GetFolderAsync(vaultId, folderId, ct);
        if (folder is null) return NotFound();
        return Ok(MapToResponse(folder));
    }

    private async Task<bool> CanAccessVault(string vaultId, CancellationToken ct)
    {
        var vault = await vaultService.GetVaultAsync(vaultId, CurrentUserId, ct);
        return vault is not null;
    }

    private static object MapToResponse(FolderMetadata f) => new
    {
        folder_id = f.FolderId,
        name = f.Name,
        slug = f.Slug,
        path = f.Path,
        parent_folder_id = f.ParentFolderId,
        visibility = f.Visibility.ToString().ToLower(),
        file_count = f.FileCount,
        created_at = f.CreatedAt
    };
}

public record CreateFolderRequest(
    string Name,
    string? ParentId = null,
    string Visibility = "public"
);
