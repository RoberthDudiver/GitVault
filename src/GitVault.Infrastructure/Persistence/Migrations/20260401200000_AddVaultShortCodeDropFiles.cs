using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace GitVault.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddVaultShortCodeDropFiles : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Add ShortCode to Vaults (routing key for serving without file table)
            migrationBuilder.AddColumn<string>(
                name: "ShortCode",
                table: "Vaults",
                type: "TEXT",
                nullable: false,
                defaultValue: "");

            migrationBuilder.CreateIndex(
                name: "IX_Vaults_ShortCode",
                table: "Vaults",
                column: "ShortCode",
                unique: true);

            // Drop the Files table — all file metadata moves to GitHub (encrypted)
            migrationBuilder.DropTable(name: "Files");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Vaults_ShortCode",
                table: "Vaults");

            migrationBuilder.DropColumn(
                name: "ShortCode",
                table: "Vaults");

            // Note: Files table is not restored in Down — data was in GitHub.
        }
    }
}
