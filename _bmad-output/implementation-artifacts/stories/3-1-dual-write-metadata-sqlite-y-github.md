# Story 3.1: Dual-Write Metadata SQLite y GitHub

## Outcome

Al crear un archivo, los metadatos se escriben síncronamente en SQLite (fuente primaria para queries rápidas) y asincrónicamente en el repo GitHub en `/meta/files/{ab}/{cd}/{logical_id}.json` más un índice invertido en `/meta/index/public_ids/{ab}/{cd}/{public_id}` (fire-and-forget, fuente de verdad para recuperación).

## Evidence In Repo

- `src/GitVault.Infrastructure/Services/MetadataService.cs` — `CreateFileMetadataAsync`, `WriteFileMetaToRepoAsync`
- `src/GitVault.Infrastructure/Persistence/GitVaultDbContext.cs`
- `src/GitVault.Core/Entities/FileMetadata.cs`

## Notes

El dual-write es asíncrono para no bloquear el response al usuario. Si SQLite falla, la operación falla. Si GitHub falla (fire-and-forget), se loguea como warning pero la operación sigue siendo exitosa — el repo se puede reconstruir desde SQLite o vice versa.
