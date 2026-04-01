# Story 1.3: Deduplicación y Verificación SHA-256

## Outcome

Antes de subir un blob, el sistema calcula su SHA-256, verifica si ya existe en caché o en el repo, y reutiliza el blob existente si lo encuentra. La deduplicación es transparente al usuario.

## Evidence In Repo

- `src/GitVault.Core/Services/ICryptoService.cs` — `ComputeSha256(Stream)`
- `src/GitVault.Infrastructure/Crypto/CryptoService.cs`
- `src/GitVault.Infrastructure/Services/StorageService.cs` — `BlobExistsAsync`
- `src/GitVault.Core/Services/ICacheService.cs` — `CacheTtl.BlobExists = 2h`
- `tests/GitVault.Tests/CryptoServiceTests.cs` — tests de SHA-256 con valores conocidos

## Notes

SHA-256 se calcula sobre el stream original antes de enviarlo a GitHub. El stream se resetea a posición 0 después del cálculo para poder reutilizarlo. Los 18 unit tests de CryptoService están todos en verde.
