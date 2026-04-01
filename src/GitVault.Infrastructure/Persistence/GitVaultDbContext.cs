using GitVault.Core.Entities;
using Microsoft.EntityFrameworkCore;

namespace GitVault.Infrastructure.Persistence;

public class GitVaultDbContext(DbContextOptions<GitVaultDbContext> options) : DbContext(options)
{
    public DbSet<User> Users => Set<User>();
    public DbSet<VaultRepository> Vaults => Set<VaultRepository>();
    public DbSet<FileMetadata> Files => Set<FileMetadata>();
    public DbSet<FolderMetadata> Folders => Set<FolderMetadata>();
    public DbSet<AppClient> Apps => Set<AppClient>();
    public DbSet<ApiCredential> Credentials => Set<ApiCredential>();

    protected override void OnModelCreating(ModelBuilder model)
    {
        // ── User ──────────────────────────────────────────────────────────────
        model.Entity<User>(e =>
        {
            e.HasKey(u => u.UserId);
            e.HasIndex(u => u.Email).IsUnique();
            e.HasIndex(u => u.GitHubUserId);
        });

        // ── VaultRepository ───────────────────────────────────────────────────
        model.Entity<VaultRepository>(e =>
        {
            e.HasKey(v => v.VaultId);
            e.HasIndex(v => new { v.UserId, v.RepoFullName }).IsUnique();
            e.HasIndex(v => v.InstallationId);
            e.HasOne(v => v.User)
             .WithMany()
             .HasForeignKey(v => v.UserId)
             .OnDelete(DeleteBehavior.Cascade);
        });

        // ── FileMetadata ──────────────────────────────────────────────────────
        model.Entity<FileMetadata>(e =>
        {
            e.HasKey(f => f.LogicalId);
            e.HasIndex(f => f.PublicId).IsUnique();
            e.HasIndex(f => new { f.VaultId, f.FolderId });
            e.HasIndex(f => new { f.VaultId, f.IsDeleted });
            e.HasOne(f => f.Vault)
             .WithMany()
             .HasForeignKey(f => f.VaultId)
             .OnDelete(DeleteBehavior.Cascade);
            e.Property(f => f.Visibility).HasConversion<string>();
        });

        // ── FolderMetadata ────────────────────────────────────────────────────
        model.Entity<FolderMetadata>(e =>
        {
            e.HasKey(f => f.FolderId);
            e.HasIndex(f => new { f.VaultId, f.ParentFolderId });
            e.HasOne(f => f.Vault)
             .WithMany()
             .HasForeignKey(f => f.VaultId)
             .OnDelete(DeleteBehavior.Cascade);
            e.Property(f => f.Visibility).HasConversion<string>();
        });

        // ── AppClient ─────────────────────────────────────────────────────────
        model.Entity<AppClient>(e =>
        {
            e.HasKey(a => a.AppId);
            e.HasIndex(a => a.UserId);
            e.HasOne(a => a.User)
             .WithMany()
             .HasForeignKey(a => a.UserId)
             .OnDelete(DeleteBehavior.Cascade);
        });

        // ── ApiCredential ─────────────────────────────────────────────────────
        model.Entity<ApiCredential>(e =>
        {
            e.HasKey(c => c.CredentialId);
            e.HasIndex(c => c.ApiKey).IsUnique();
            e.HasIndex(c => c.AppId);
            e.HasOne(c => c.App)
             .WithMany(a => a.Credentials)
             .HasForeignKey(c => c.AppId)
             .OnDelete(DeleteBehavior.Cascade);
        });
    }
}
