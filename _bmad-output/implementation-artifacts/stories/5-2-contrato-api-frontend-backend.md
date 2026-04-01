# Story 5.2: Contrato API Frontend-Backend

## Status: in-progress

## Outcome

Todos los campos de la API se mapean correctamente entre el backend (.NET, snake_case) y el frontend (TypeScript, camelCase). El flujo de onboarding usa el state HMAC firmado del backend. La página de callback lee `installation_id` de los params de GitHub.

## Bugs Pendientes

### 1. snake_case vs camelCase
El backend devuelve `logical_id`, `public_id`, `app_id`, `is_active`, `vault_id`, etc. El frontend espera `logicalId`, `publicId`, `appId`, `isActive`, `vaultId`. **Solución**: configurar axios con un response interceptor que transforme snake_case → camelCase usando una función recursiva, o configurar la serialización JSON del backend para devolver camelCase.

### 2. Onboarding flow roto
La página `/onboarding` construye la install URL directamente sin pasar por el backend. **Solución**: llamar a `POST /v1/auth/connect-github` (que genera el state HMAC) y usar la `installation_url` devuelta.

### 3. GitHub callback lee `code` en vez de `installation_id`
GitHub App manda `?installation_id=XXX&setup_action=install`, no `?code=XXX`. **Solución**: cambiar la página `/github/callback` para leer `installation_id` del searchParams.

### 4. Falta página `/onboarding/select-repo` (o redirigir a `/vault`)
El backend redirige a `{FRONTEND_URL}/onboarding/select-repo?installation_id=...` después del callback. O se crea esa página o se cambia el redirect del backend a `/vault`.

## Evidence In Repo

- `web/hooks/useFiles.ts` — interfaces TypeScript pendientes de fix
- `web/hooks/useVaults.ts` — idem
- `web/hooks/useApps.ts` — idem
- `web/app/onboarding/page.tsx` — flujo a corregir
- `web/app/github/callback/page.tsx` — params a corregir
- `src/GitVault.Api/Controllers/AuthController.cs` — `GitHubCallback` redirect
