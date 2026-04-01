using System.Text;
using System.Text.Json;
using GitVault.Core.Common;
using GitVault.Core.Entities;
using GitVault.Core.Services;
using GitVault.Infrastructure.GitHub;
using GitVault.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Octokit;

namespace GitVault.Infrastructure.Services;

public class VaultService(
    GitVaultDbContext db,
    GitHubClientFactory clientFactory,
    IGitHubContentService gitHubContent,
    ICacheService cache,
    ICryptoService crypto,
    ILogger<VaultService> logger) : IVaultService
{
    public async Task<Result<IReadOnlyList<GitHubRepoInfo>>> ListAvailableReposAsync(
        string userId, CancellationToken ct)
    {
        var installation = await GetInstallationIdAsync(userId, ct);
        if (installation is null)
            return Result.Fail<IReadOnlyList<GitHubRepoInfo>>(
                ErrorCodes.Unauthorized, "GitHub App not installed. Please connect GitHub first.");

        try
        {
            var client = await clientFactory.GetInstallationClientAsync(installation.Value, ct);
            var repos = await client.GitHubApps.Installation.GetAllRepositoriesForCurrent().WaitAsync(ct);

            var result = repos.Repositories.Select(r => new GitHubRepoInfo(
                r.Id, r.FullName, r.Name, r.Private, r.DefaultBranch ?? "main", r.HtmlUrl
            )).ToList();

            return Result.Ok<IReadOnlyList<GitHubRepoInfo>>(result);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error listing repos for user {UserId}", userId);
            return Result.Fail<IReadOnlyList<GitHubRepoInfo>>(ErrorCodes.GitHubError, ex.Message);
        }
    }

    public async Task<Result<VaultRepository>> ConnectVaultAsync(
        string userId, string repoFullName, CancellationToken ct)
    {
        var existing = await db.Vaults.FirstOrDefaultAsync(
            v => v.UserId == userId && v.RepoFullName == repoFullName, ct);

        if (existing is not null)
            return Result.Ok(existing); // Idempotent

        var installation = await GetInstallationIdAsync(userId, ct);
        if (installation is null)
            return Result.Fail<VaultRepository>(ErrorCodes.Unauthorized,
                "GitHub App not installed.");

        // Get repo info from GitHub
        var (owner, repo) = SplitRepo(repoFullName);
        try
        {
            var client = await clientFactory.GetInstallationClientAsync(installation.Value, ct);
            var ghRepo = await client.Repository.Get(owner, repo).WaitAsync(ct);

            var vault = new VaultRepository
            {
                VaultId = Guid.NewGuid().ToString(),
                UserId = userId,
                InstallationId = installation.Value,
                RepoFullName = repoFullName,
                RepoId = ghRepo.Id,
                IsPrivate = ghRepo.Private,
                DefaultBranch = ghRepo.DefaultBranch ?? "main",
                IsInitialized = false,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            db.Vaults.Add(vault);
            await db.SaveChangesAsync(ct);

            await InitializeVaultStructureAsync(vault, ct);
            return Result.Ok(vault);
        }
        catch (NotFoundException)
        {
            return Result.Fail<VaultRepository>(ErrorCodes.NotFound,
                $"Repository {repoFullName} not found or not accessible.");
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error connecting vault {Repo}", repoFullName);
            return Result.Fail<VaultRepository>(ErrorCodes.GitHubError, ex.Message);
        }
    }

    public async Task<Result<VaultRepository>> CreateVaultAsync(
        string userId, string repoName, bool isPrivate, CancellationToken ct)
    {
        var installation = await GetInstallationIdAsync(userId, ct);
        if (installation is null)
            return Result.Fail<VaultRepository>(ErrorCodes.Unauthorized,
                "GitHub App not installed.");

        var createResult = await gitHubContent.CreateRepositoryAsync(
            installation.Value, repoName, isPrivate, ct);

        string repoFullName;
        long repoId;
        string defaultBranch;

        if (!createResult.IsSuccess)
        {
            // Fallback: try with the user's Personal Access Token if available
            var dbUser = await db.Users.FindAsync([userId], ct);
            var pat = dbUser?.GitHubPersonalTokenEncrypted is not null
                ? crypto.Decrypt(dbUser.GitHubPersonalTokenEncrypted)
                : null;

            if (pat is null)
                return Result.Fail<VaultRepository>(
                    ErrorCodes.GitHubError,
                    "No se pudo crear el repositorio con la GitHub App. " +
                    "Configura un Personal Access Token en Ajustes como alternativa.");

            var patResult = await gitHubContent.CreateRepositoryWithTokenAsync(pat, repoName, isPrivate, ct);
            if (!patResult.IsSuccess)
                return Result.Fail<VaultRepository>(patResult.ErrorCode!, patResult.ErrorMessage!);

            (repoId, defaultBranch, repoFullName) = patResult.Value;
        }
        else
        {
            (repoId, defaultBranch, repoFullName) = createResult.Value;
        }

        var vault = new VaultRepository
        {
            VaultId = Guid.NewGuid().ToString(),
            UserId = userId,
            InstallationId = installation.Value,
            RepoFullName = repoFullName,
            RepoId = repoId,
            IsPrivate = isPrivate,
            DefaultBranch = defaultBranch,
            IsInitialized = false,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        db.Vaults.Add(vault);
        await db.SaveChangesAsync(ct);

        await InitializeVaultStructureAsync(vault, ct);
        return Result.Ok(vault);
    }

    public async Task<IReadOnlyList<VaultRepository>> ListVaultsAsync(string userId, CancellationToken ct)
    {
        return await db.Vaults
            .Where(v => v.UserId == userId)
            .OrderByDescending(v => v.CreatedAt)
            .ToListAsync(ct);
    }

    public async Task<VaultRepository?> GetVaultAsync(string vaultId, string userId, CancellationToken ct)
    {
        var cacheKey = CacheKeys.Vault(vaultId);
        if (cache.TryGet<VaultRepository>(cacheKey, out var cached)) return cached;

        var vault = await db.Vaults.FirstOrDefaultAsync(
            v => v.VaultId == vaultId && v.UserId == userId, ct);

        if (vault is not null) cache.Set(cacheKey, vault, CacheTtl.Vault);
        return vault;
    }

    // ── Private helpers ───────────────────────────────────────────────────────

    private async Task InitializeVaultStructureAsync(VaultRepository vault, CancellationToken ct)
    {
        try
        {
            var config = new
            {
                vault_id = vault.VaultId,
                schema_version = "1",
                created_at = vault.CreatedAt.ToString("O"),
                repo_full_name = vault.RepoFullName
            };

            var configJson = JsonSerializer.Serialize(config, new JsonSerializerOptions { WriteIndented = true });

            var files = new List<(string Path, byte[] Content)>
            {
                (".gitvault/.gitkeep", Encoding.UTF8.GetBytes("")),
                ("objects/.gitkeep", Encoding.UTF8.GetBytes("")),
                ("meta/config.json", Encoding.UTF8.GetBytes(configJson)),
                ("meta/files/.gitkeep", Encoding.UTF8.GetBytes("")),
                ("meta/folders/.gitkeep", Encoding.UTF8.GetBytes("")),
                ("meta/apps/.gitkeep", Encoding.UTF8.GetBytes("")),
                ("meta/index/.gitkeep", Encoding.UTF8.GetBytes("")),
            };

            var result = await gitHubContent.WriteBatchAsync(
                vault.InstallationId,
                vault.RepoFullName,
                vault.DefaultBranch,
                files,
                "chore: initialize GitVault storage structure",
                ct);

            if (result.IsSuccess)
            {
                vault.IsInitialized = true;
                vault.UpdatedAt = DateTime.UtcNow;
                await db.SaveChangesAsync(ct);
                logger.LogInformation("Vault {VaultId} initialized in {Repo}", vault.VaultId, vault.RepoFullName);
            }
            else
            {
                logger.LogWarning("Failed to initialize vault {VaultId}: {Error}", vault.VaultId, result.ErrorMessage);
            }
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error initializing vault {VaultId}", vault.VaultId);
        }
    }

    private async Task<long?> GetInstallationIdAsync(string userId, CancellationToken ct)
    {
        var user = await db.Users.FindAsync([userId], ct);
        return user?.GitHubInstallationId;
    }

    private static (string Owner, string Repo) SplitRepo(string fullName)
    {
        var parts = fullName.Split('/', 2);
        return (parts[0], parts[1]);
    }
}
