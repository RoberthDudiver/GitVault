# Story 1.2: CAS Blob Upload via Git Data API

## Outcome

Los archivos se almacenan como blobs content-addressable en `/objects/{ab}/{cd}/{sha256}` usando el Git Data API de GitHub. N archivos requieren N+3 llamadas API: N blobs en paralelo + 1 tree + 1 commit + 1 ref update.

## Evidence In Repo

- `src/GitVault.Infrastructure/GitHub/GitHubContentService.cs` — `WriteBatchAsync`
- `src/GitVault.Core/Services/IGitHubContentService.cs`
- `src/GitVault.Infrastructure/Services/StorageService.cs` — `UploadBlobAsync`, `UploadBlobBatchAsync`

## Notes

Se usó el Git Data API en lugar del Contents API para soportar batch uploads eficientes. `NewTree.Tree` en Octokit es read-only — se usa `.Add()` en un foreach en lugar de inicialización directa. Los blobs son inmutables por definición del CAS, por lo que el caché de existencia tiene TTL de 2 horas sin invalidación activa.
