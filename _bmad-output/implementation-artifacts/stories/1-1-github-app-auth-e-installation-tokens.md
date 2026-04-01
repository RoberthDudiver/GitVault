# Story 1.1: GitHub App Auth e Installation Tokens

## Outcome

El sistema se autentica en GitHub via GitHub App (JWT firmado con RSA), obtiene installation access tokens por `installation_id`, y los cachea 55 minutos en Redis/IMemoryCache para evitar el rate limit de 1 token/hora.

## Evidence In Repo

- `src/GitVault.Infrastructure/GitHub/GitHubClientFactory.cs`
- `src/GitVault.Core/Services/ICacheService.cs` — `CacheKeys.GitHubToken`, `CacheTtl.GitHubToken`
- `src/GitVault.Core/Entities/User.cs` — campo `GitHubInstallationId`
- `src/GitVault.Api/Controllers/AuthController.cs` — GitHub OAuth callback
- `src/GitVault.Api/Controllers/WebhookController.cs` — `installation.created` event

## Notes

El `installation_id` se guarda en `User.GitHubInstallationId` al completar el OAuth flow o al recibir el webhook `installation.created`. `GitHubClientFactory.GetInstallationClientAsync` verifica caché antes de llamar a `/app/installations/{id}/access_tokens`.
