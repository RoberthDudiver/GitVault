using GitVault.Api.Extensions;
using GitVault.Core.Common;
using GitVault.Core.Entities;
using GitVault.Core.Services;
using Microsoft.AspNetCore.Mvc;

namespace GitVault.Api.Controllers;

[Route("v1/vaults/{vaultId}/files")]
public class FilesController(
    IStorageService storage,
    IMetadataService metadata,
    ICryptoService crypto,
    IVaultService vaultService) : BaseApiController
{
    private const long MaxFileSizeBytes = 10 * 1024 * 1024; // 10 MB

    /// <summary>Lists all files in a vault with optional pagination.</summary>
    /// <remarks>Supports filtering by folder (`folderId`). Maximum 100 results per page.</remarks>
    [HttpGet]
    public async Task<IActionResult> List(
        string vaultId,
        [FromQuery] string? folderId,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50,
        CancellationToken ct = default)
    {
        if (!await CanAccessVault(vaultId, ct)) return Forbid();
        if (User.IsApiKeyAuth() && !HasScope("files:read")) return Forbid();

        pageSize = Math.Clamp(pageSize, 1, 100);
        var (files, total) = await metadata.ListFilesAsync(vaultId, folderId, page, pageSize, ct);

        return Ok(new { files = files.Select(MapToResponse), total, page, page_size = pageSize });
    }

    /// <summary>Uploads a file to the vault (max 10 MB).</summary>
    /// <remarks>The file is stored in the vault's GitHub repository. Returns metadata with `publicId` to build the public URL.</remarks>
    [HttpPost]
    [RequestSizeLimit(10 * 1024 * 1024)]
    public async Task<IActionResult> Upload(
        string vaultId,
        IFormFile file,
        [FromForm] string? folderId,
        [FromForm] string visibility = "public",
        CancellationToken ct = default)
    {
        if (!await CanAccessVault(vaultId, ct)) return Forbid();
        if (User.IsApiKeyAuth() && !HasScope("files:write")) return Forbid();

        if (file.Length == 0) return BadRequest(new { error = "EMPTY_FILE" });
        if (file.Length > MaxFileSizeBytes)
            return BadRequest(new { error = ErrorCodes.FileTooLarge, message = "Max file size is 10 MB." });

        using var stream = file.OpenReadStream();
        var blobResult = await storage.UploadBlobAsync(vaultId, stream, file.ContentType, ct);
        if (!blobResult.IsSuccess) return FromResult(blobResult);

        var logicalId = crypto.NewLogicalId();
        var publicId = crypto.ComputePublicId(logicalId);

        var fileMeta = new FileMetadata
        {
            LogicalId = logicalId,
            PublicId = publicId,
            UserId = CurrentUserId,
            VaultId = vaultId,
            FolderId = folderId,
            OriginalName = file.FileName,
            ContentType = file.ContentType,
            SizeBytes = file.Length,
            Sha256 = blobResult.Value!.Sha256,
            Visibility = Enum.TryParse<FileVisibility>(visibility, true, out var v) ? v : FileVisibility.Public
        };

        var metaResult = await metadata.CreateFileMetadataAsync(fileMeta, ct);
        if (!metaResult.IsSuccess) return FromResult(metaResult);

        return Ok(MapToResponse(metaResult.Value!));
    }

    /// <summary>Uploads up to 20 files in a single request (max 100 MB total).</summary>
    /// <remarks>Returns `uploaded` with successful items and `failed` with those that failed, without aborting the entire batch.</remarks>
    [HttpPost("batch")]
    [RequestSizeLimit(100 * 1024 * 1024)]
    public async Task<IActionResult> UploadBatch(
        string vaultId,
        IFormFileCollection files,
        [FromForm] string? folderId,
        [FromForm] string visibility = "public",
        CancellationToken ct = default)
    {
        if (!await CanAccessVault(vaultId, ct)) return Forbid();
        if (User.IsApiKeyAuth() && !HasScope("files:write")) return Forbid();

        if (files.Count == 0) return BadRequest(new { error = "NO_FILES" });
        if (files.Count > 20) return BadRequest(new { error = "TOO_MANY_FILES", message = "Maximum 20 files per batch." });

        var items = files.Select(f => new BatchUploadItem(
            f.OpenReadStream(), f.FileName, f.ContentType, folderId
        )).ToList();

        var batchResult = await storage.UploadBlobBatchAsync(vaultId, items, ct);

        var uploaded = new List<object>();
        var failed = new List<object>();

        foreach (var (item, blob) in batchResult.Succeeded)
        {
            var logicalId = crypto.NewLogicalId();
            var publicId = crypto.ComputePublicId(logicalId);
            var fileMeta = new FileMetadata
            {
                LogicalId = logicalId,
                PublicId = publicId,
                UserId = CurrentUserId,
                VaultId = vaultId,
                FolderId = folderId,
                OriginalName = item.OriginalName,
                ContentType = item.ContentType,
                SizeBytes = blob.SizeBytes,
                Sha256 = blob.Sha256,
                Visibility = Enum.TryParse<FileVisibility>(visibility, true, out var v) ? v : FileVisibility.Public
            };
            var metaResult = await metadata.CreateFileMetadataAsync(fileMeta, ct);
            if (metaResult.IsSuccess) uploaded.Add(MapToResponse(metaResult.Value!));
            else failed.Add(new { name = item.OriginalName, error = metaResult.ErrorMessage });
        }

        foreach (var (item, error) in batchResult.Failed)
            failed.Add(new { name = item.OriginalName, error });

        return Ok(new { uploaded, failed });
    }

    /// <summary>Gets file metadata by its logical ID.</summary>
    [HttpGet("{logicalId}")]
    public async Task<IActionResult> GetMeta(string vaultId, string logicalId, CancellationToken ct)
    {
        if (!await CanAccessVault(vaultId, ct)) return Forbid();
        if (User.IsApiKeyAuth() && !HasScope("files:read")) return Forbid();

        var file = await metadata.GetByLogicalIdAsync(vaultId, logicalId, ct);
        if (file is null) return NotFound();
        return Ok(MapToResponse(file));
    }

    /// <summary>Updates file metadata: visibility, folder, or name.</summary>
    [HttpPatch("{logicalId}")]
    public async Task<IActionResult> Update(
        string vaultId,
        string logicalId,
        [FromBody] UpdateFileRequest request,
        CancellationToken ct)
    {
        if (!await CanAccessVault(vaultId, ct)) return Forbid();

        var file = await metadata.GetByLogicalIdAsync(vaultId, logicalId, ct);
        if (file is null) return NotFound();
        if (file.UserId != CurrentUserId) return Forbid();

        if (request.Visibility is not null &&
            Enum.TryParse<FileVisibility>(request.Visibility, true, out var v))
            file.Visibility = v;

        if (request.FolderId is not null) file.FolderId = request.FolderId;
        if (request.OriginalName is not null) file.OriginalName = request.OriginalName;
        file.UpdatedAt = DateTime.UtcNow;

        var result = await metadata.UpdateFileAsync(file, ct);
        return FromResult(result);
    }

    /// <summary>Soft-deletes a file from the vault.</summary>
    /// <remarks>The file is no longer accessible via its public URL. The GitHub blob is removed in the next cleanup cycle.</remarks>
    [HttpDelete("{logicalId}")]
    public async Task<IActionResult> Delete(string vaultId, string logicalId, CancellationToken ct)
    {
        if (!await CanAccessVault(vaultId, ct)) return Forbid();

        var file = await metadata.GetByLogicalIdAsync(vaultId, logicalId, ct);
        if (file is null) return NotFound();
        if (file.UserId != CurrentUserId) return Forbid();

        var result = await metadata.SoftDeleteFileAsync(vaultId, logicalId, ct);
        if (!result.IsSuccess)
            return result.ErrorCode == ErrorCodes.NotFound
                ? NotFound(new { error = result.ErrorCode, message = result.ErrorMessage })
                : BadRequest(new { error = result.ErrorCode, message = result.ErrorMessage });
        return NoContent();
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private async Task<bool> CanAccessVault(string vaultId, CancellationToken ct)
    {
        var vault = await vaultService.GetVaultAsync(vaultId, CurrentUserId, ct);
        return vault is not null;
    }

    private static object MapToResponse(FileMetadata f) => new
    {
        logicalId = f.LogicalId,
        publicId = f.PublicId,
        url = $"/f/{f.PublicId}",
        originalName = f.OriginalName,
        contentType = f.ContentType,
        sizeBytes = f.SizeBytes,
        visibility = f.Visibility.ToString().ToLower(),
        folderId = f.FolderId,
        createdAt = f.CreatedAt,
        updatedAt = f.UpdatedAt
    };
}

public record UpdateFileRequest(
    string? Visibility,
    string? FolderId,
    string? OriginalName
);
