# Story 4.3: Apps y Credentials Management

## Outcome

El usuario puede crear aplicaciones con nombre, scopes (`files:read`, `files:write`, `files:delete`) y acceso a vaults específicos. Desde el detalle de cada app puede generar credenciales API, ver el secreto una única vez en un panel ámbar con advertencia, y revocar credenciales existentes.

## Evidence In Repo

- `web/app/(auth)/apps/page.tsx` — lista de apps + modal crear app
- `web/app/(auth)/apps/[appId]/page.tsx` — detalle + credentials
- `web/hooks/useApps.ts` — CRUD completo de apps y credenciales

## Notes

El secreto se muestra en un banner ámbar con `"Esta credencial no se mostrará de nuevo. Guárdala ahora."` Al hacer click en "Ya lo guardé, cerrar" el banner desaparece. Pendiente mismo fix de snake_case vs camelCase que en el vault explorer.
