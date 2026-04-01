# Story 2.3: HMAC Public ID y SERVER_SECRET

## Outcome

Cada archivo tiene un `public_id` de 12 caracteres base62 derivado como `HMAC-SHA256(logical_id, SERVER_SECRET)[0:12]`. El `SERVER_SECRET` vive solo en variables de entorno del servidor. La verificación usa `CryptographicOperations.FixedTimeEquals` para resistir timing attacks.

## Evidence In Repo

- `src/GitVault.Infrastructure/Crypto/CryptoService.cs` — `ComputePublicId`, `VerifyPublicId`, `ToBase62`
- `src/GitVault.Core/Services/ICryptoService.cs`
- `tests/GitVault.Tests/CryptoServiceTests.cs` — 18 tests incluyendo determinismo, diferentes secretos, tamper detection
- `.env` (no commiteado) — `SERVER_SECRET=whsec_...`

## Notes

El algoritmo es completamente público (open source). La seguridad proviene exclusivamente del `SERVER_SECRET`. Sin el secreto, un atacante no puede adivinar el `public_id` de un archivo privado ni derivar `logical_id` a partir del `public_id`. `GenerateStateToken` usa el mismo patrón HMAC para tokens CSRF del OAuth flow, con expiración de 10 minutos.
