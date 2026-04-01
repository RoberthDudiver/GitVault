# Story 3.2: Serving Público via CDN Redirect

## Outcome

`GET /f/{publicId}` verifica el HMAC del publicId, resuelve la metadata del archivo, y si es público en un repo público devuelve `302 Location: https://raw.githubusercontent.com/{owner}/{repo}/{branch}/{path}`. El archivo se sirve directamente desde la CDN de GitHub sin consumir ninguna llamada a la API.

## Evidence In Repo

- `src/GitVault.Infrastructure/Services/ServingService.cs` — `ServeFileAsync`
- `src/GitVault.Api/Controllers/ServingController.cs` — `GET /f/{publicId}`
- `src/GitVault.Infrastructure/GitHub/GitHubContentService.cs` — `GetRawUrl`

## Notes

El 302 redirect es la optimización clave del sistema: archivos públicos se sirven con 0 llamadas API de GitHub y la latencia es la de la CDN de raw.githubusercontent.com. El rate limit de 600 req/min en la ruta `/f/` está configurado en el middleware de rate limiting.
