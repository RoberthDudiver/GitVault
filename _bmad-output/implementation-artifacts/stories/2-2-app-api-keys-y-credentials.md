# Story 2.2: App API Keys y Credentials

## Outcome

Los usuarios crean aplicaciones con scopes (`files:read`, `files:write`, `files:delete`) y vault access. Cada app puede tener múltiples credenciales `api_key:api_secret`. El secreto se muestra una única vez al crearlo (reveal modal) y se almacena hasheado con bcrypt (work factor 12). La autenticación Basic `Authorization: Basic base64(key:secret)` funciona en todos los endpoints de la API.

## Evidence In Repo

- `src/GitVault.Api/Middleware/ApiKeyAuthHandler.cs`
- `src/GitVault.Infrastructure/Services/AppService.cs`
- `src/GitVault.Core/Services/ICryptoService.cs` — `GenerateApiKey`, `GenerateApiSecret`, `HashSecret`, `VerifySecret`
- `src/GitVault.Api/Controllers/AppsController.cs`
- `web/app/(auth)/apps/` — páginas de gestión de apps

## Notes

El `api_secret` en la respuesta de `POST /apps/{id}/credentials` es la ÚNICA vez que aparece en claro. El campo `api_secret` nunca se devuelve en `GET /credentials`. El frontend muestra un modal con fondo ámbar y botón "Ya lo guardé, cerrar".
