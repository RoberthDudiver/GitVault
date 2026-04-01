# Story 2.1: Firebase JWT Authentication

## Outcome

El backend valida Firebase idTokens usando el Firebase Admin SDK, extrae `uid`, `email` y `name` del token, y popula el `ClaimsPrincipal` para el resto del pipeline. Los controladores protegidos con `[Authorize(AuthenticationSchemes = "Firebase,ApiKey")]` rechazan requests sin token válido.

## Evidence In Repo

- `src/GitVault.Core/Services/IFirebaseTokenValidator.cs`
- `src/GitVault.Infrastructure/Firebase/FirebaseTokenValidator.cs`
- `src/GitVault.Api/Middleware/FirebaseAuthHandler.cs`
- `src/GitVault.Api/Controllers/BaseApiController.cs` — `[Authorize]` base
- `src/GitVault.Api/Controllers/AuthController.cs` — `GET /v1/auth/me` (auto-provision)

## Notes

`FirebaseTokenValidator` fue extraído como interfaz propia para poder inyectarlo en `ServingService` (que no es un controller) sin depender de `IHttpContextAccessor`. El auto-provision en `/auth/me` crea el registro `User` en SQLite la primera vez que el usuario se autentica.
