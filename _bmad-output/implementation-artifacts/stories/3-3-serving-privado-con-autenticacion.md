# Story 3.3: Serving Privado con Autenticación

## Outcome

Archivos privados se sirven via stream desde el backend. El endpoint acepta dos esquemas de autenticación: Firebase Bearer token (validado por `IFirebaseTokenValidator`) y Basic `api_key:api_secret`. Tras autenticar, verifica que el usuario/app tenga acceso al vault del archivo antes de hacer stream del contenido.

## Evidence In Repo

- `src/GitVault.Infrastructure/Services/ServingService.cs` — `ServeFileAsync` rama privada
- `src/GitVault.Core/Services/IFirebaseTokenValidator.cs`
- `src/GitVault.Infrastructure/Firebase/FirebaseTokenValidator.cs`
- `src/GitVault.Api/Middleware/ApiKeyAuthHandler.cs`

## Notes

El caché de metadata de archivos tiene TTL de 1 hora. El caché negativo (`__NF__`) dura 15 minutos para evitar hammering en publicIds inexistentes. El `IFirebaseTokenValidator` fue creado como interfaz propia para poder usarlo fuera del pipeline de ASP.NET Core (en servicios de infraestructura).
