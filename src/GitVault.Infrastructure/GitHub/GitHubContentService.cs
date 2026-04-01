using System.Text;
using GitVault.Core.Common;
using GitVault.Core.Services;
using Microsoft.Extensions.Logging;
using Octokit;

namespace GitVault.Infrastructure.GitHub;

public class GitHubContentService(
    GitHubClientFactory clientFactory,
    ILogger<GitHubContentService> logger) : IGitHubContentService
{
    public async Task<GitHubFile?> ReadFileAsync(
        long installationId,
        string repoFullName,
        string path,
        CancellationToken ct = default)
    {
        try
        {
            var (owner, repo) = Split(repoFullName);
            var client = await clientFactory.GetInstallationClientAsync(installationId, ct);
            var contents = await client.Repository.Content.GetAllContents(owner, repo, path)
                .WaitAsync(ct);

            var file = contents.FirstOrDefault();
            if (file is null) return null;

            // GitHub Contents API returns empty Content for files > 1 MB.
            // Fall back to the Git Blobs API which supports files up to 100 MB.
            var content = file.Content;
            if (string.IsNullOrEmpty(content))
            {
                logger.LogDebug("File {Path} > 1 MB, fetching via Git Blobs API (git sha: {Sha})", path, file.Sha);
                var blob = await client.Git.Blob.Get(owner, repo, file.Sha).WaitAsync(ct);
                content = blob.Content;
            }

            return new GitHubFile(file.Path, content, file.Sha);
        }
        catch (NotFoundException)
        {
            return null;
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Error reading {Path} from {Repo}", path, repoFullName);
            return null;
        }
    }

    public async Task<bool> FileExistsAsync(
        long installationId,
        string repoFullName,
        string path,
        CancellationToken ct = default)
    {
        try
        {
            var (owner, repo) = Split(repoFullName);
            var client = await clientFactory.GetInstallationClientAsync(installationId, ct);
            await client.Repository.Content.GetAllContents(owner, repo, path).WaitAsync(ct);
            return true;
        }
        catch (NotFoundException)
        {
            return false;
        }
    }

    public async Task<Result<GitHubWriteResult>> WriteFileAsync(
        long installationId,
        string repoFullName,
        string path,
        byte[] content,
        string commitMessage,
        string? existingFileSha = null,
        CancellationToken ct = default)
    {
        try
        {
            var (owner, repo) = Split(repoFullName);
            var client = await clientFactory.GetInstallationClientAsync(installationId, ct);
            var base64 = Convert.ToBase64String(content);

            RepositoryContentChangeSet result;
            if (existingFileSha is null)
            {
                result = await client.Repository.Content
                    .CreateFile(owner, repo, path, new CreateFileRequest(commitMessage, base64, true))
                    .WaitAsync(ct);
            }
            else
            {
                result = await client.Repository.Content
                    .UpdateFile(owner, repo, path, new UpdateFileRequest(commitMessage, base64, existingFileSha))
                    .WaitAsync(ct);
            }

            return Result.Ok(new GitHubWriteResult(path, result.Commit.Sha));
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error writing {Path} to {Repo}", path, repoFullName);
            return Result.Fail<GitHubWriteResult>(ErrorCodes.GitHubError, ex.Message);
        }
    }

    /// <summary>
    /// Batch write using Git Data API — creates/updates N files in a single commit.
    /// Steps: create blobs → create tree → create commit → update ref.
    /// API call cost: N+3 (one per blob + tree + commit + ref).
    /// </summary>
    public async Task<Result<string>> WriteBatchAsync(
        long installationId,
        string repoFullName,
        string branch,
        IReadOnlyList<(string Path, byte[] Content)> files,
        string commitMessage,
        CancellationToken ct = default)
    {
        try
        {
            var (owner, repo) = Split(repoFullName);
            var client = await clientFactory.GetInstallationClientAsync(installationId, ct);

            // 1. Get the current HEAD commit SHA for the branch
            var reference = await client.Git.Reference.Get(owner, repo, $"heads/{branch}").WaitAsync(ct);
            var headSha = reference.Object.Sha;

            // 2. Create all blobs in parallel (each is one API call)
            var blobTasks = files.Select(async f =>
            {
                var blob = await client.Git.Blob.Create(owner, repo, new NewBlob
                {
                    Content = Convert.ToBase64String(f.Content),
                    Encoding = EncodingType.Base64
                }).WaitAsync(ct);
                return (f.Path, BlobSha: blob.Sha);
            });

            var blobs = await Task.WhenAll(blobTasks).WaitAsync(ct);

            // 3. Create a new tree with all the blobs
            var newTree = new NewTree { BaseTree = headSha };
            foreach (var b in blobs)
            {
                newTree.Tree.Add(new NewTreeItem
                {
                    Path = b.Path,
                    Mode = "100644",
                    Type = TreeType.Blob,
                    Sha = b.BlobSha
                });
            }

            var tree = await client.Git.Tree.Create(owner, repo, newTree).WaitAsync(ct);

            // 4. Create the commit
            var commit = await client.Git.Commit.Create(owner, repo, new NewCommit(
                commitMessage,
                tree.Sha,
                [headSha]
            )).WaitAsync(ct);

            // 5. Update the branch reference
            await client.Git.Reference.Update(owner, repo,
                $"heads/{branch}",
                new ReferenceUpdate(commit.Sha)).WaitAsync(ct);

            return Result.Ok(commit.Sha);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Batch write failed for {Repo}", repoFullName);
            return Result.Fail<string>(ErrorCodes.GitHubError, ex.Message);
        }
    }

    public async Task<Result<(long RepoId, string DefaultBranch, string FullName)>> CreateRepositoryAsync(
        long installationId,
        string name,
        bool isPrivate,
        CancellationToken ct = default)
    {
        try
        {
            var client = await clientFactory.GetInstallationClientAsync(installationId, ct);
            var created = await client.Repository.Create(new NewRepository(name)
            {
                Private = isPrivate,
                AutoInit = true,
                Description = "GitVault storage repository"
            }).WaitAsync(ct);

            return Result.Ok((created.Id, created.DefaultBranch ?? "main", created.FullName));
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error creating repository {Name}", name);
            return Result.Fail<(long, string, string)>(ErrorCodes.GitHubError, ex.Message);
        }
    }

    public async Task<Result<(long RepoId, string DefaultBranch, string FullName)>> CreateRepositoryWithTokenAsync(
        string personalAccessToken,
        string name,
        bool isPrivate,
        CancellationToken ct = default)
    {
        try
        {
            var client = clientFactory.GetPersonalTokenClient(personalAccessToken);
            var created = await client.Repository.Create(new NewRepository(name)
            {
                Private = isPrivate,
                AutoInit = true,
                Description = "GitVault storage repository"
            }).WaitAsync(ct);

            return Result.Ok((created.Id, created.DefaultBranch ?? "main", created.FullName));
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error creating repository {Name} with PAT", name);
            return Result.Fail<(long, string, string)>(ErrorCodes.GitHubError, ex.Message);
        }
    }

    public string GetRawUrl(string repoFullName, string branch, string path)
    {
        // raw.githubusercontent.com/{owner}/{repo}/{branch}/{path}
        // This URL does NOT consume API rate limit — served by GitHub's CDN.
        return $"https://raw.githubusercontent.com/{repoFullName}/{branch}/{path}";
    }

    private static (string Owner, string Repo) Split(string repoFullName)
    {
        var parts = repoFullName.Split('/', 2);
        if (parts.Length != 2)
            throw new ArgumentException($"Invalid repo full name: {repoFullName}");
        return (parts[0], parts[1]);
    }
}
