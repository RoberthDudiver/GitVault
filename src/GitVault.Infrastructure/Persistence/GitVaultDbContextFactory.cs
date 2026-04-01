using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace GitVault.Infrastructure.Persistence;

/// <summary>
/// Design-time factory used by EF Core tools (migrations, scaffolding).
/// The main application uses DI — this is only invoked by dotnet-ef CLI.
/// </summary>
public class GitVaultDbContextFactory : IDesignTimeDbContextFactory<GitVaultDbContext>
{
    public GitVaultDbContext CreateDbContext(string[] args)
    {
        var options = new DbContextOptionsBuilder<GitVaultDbContext>()
            .UseSqlite("Data Source=gitvault-design.db")
            .Options;

        return new GitVaultDbContext(options);
    }
}
