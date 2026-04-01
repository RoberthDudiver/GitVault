using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace GitVault.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddGitHubPersonalToken : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "GitHubPersonalTokenEncrypted",
                table: "Users",
                type: "TEXT",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "GitHubPersonalTokenEncrypted",
                table: "Users");
        }
    }
}
