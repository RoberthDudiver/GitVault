using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace GitVault.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddGitHubInstallationId : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<long>(
                name: "GitHubInstallationId",
                table: "Users",
                type: "INTEGER",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "GitHubInstallationId",
                table: "Users");
        }
    }
}
