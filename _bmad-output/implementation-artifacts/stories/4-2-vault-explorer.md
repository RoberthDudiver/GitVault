# Story 4.2: Vault Explorer

## Outcome

El usuario ve la lista de sus vaults y puede conectar nuevos repos desde un modal. Dentro de un vault, puede subir archivos con drag-and-drop (o click), ver la tabla de archivos con nombre, tipo, tamaño y visibilidad, copiar la URL pública, cambiar visibilidad (public/private) con un click, y eliminar archivos con confirmación.

## Evidence In Repo

- `web/app/(auth)/vault/page.tsx` — lista de vaults + modal connect repo
- `web/app/(auth)/vault/[vaultId]/page.tsx` — explorador de archivos
- `web/hooks/useVaults.ts` — `useVaults`, `useAvailableRepos`, `useConnectVault`
- `web/hooks/useFiles.ts` — `useFiles`, `useUploadFile`, `useDeleteFile`, `useUpdateVisibility`

## Notes

Pendiente fix: los hooks usan camelCase (`logicalId`, `publicId`) pero el backend devuelve snake_case (`logical_id`, `public_id`). Necesita mapeo en los hooks o configuración de axios para transformar automáticamente.
