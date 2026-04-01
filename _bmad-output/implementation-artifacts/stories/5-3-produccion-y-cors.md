# Story 5.3: Producción y CORS

## Status: backlog

## Outcome

El sistema está listo para desplegarse en `api.gitvault.dudiver.net` y `gitvault.dudiver.net` con CORS correctamente configurado, Next.js generando output standalone para Docker, y páginas de error (404, error boundary) en el frontend.

## Tasks Pendientes

### 1. `next.config.ts` — output standalone
El `web/Dockerfile` copia `.next/standalone` pero Next.js no lo genera sin `output: "standalone"` en `next.config.ts`. El build de Docker fallaría en producción.

**Solución**:
```ts
const nextConfig: NextConfig = {
  output: "standalone",
};
```

### 2. Páginas de error en el frontend
- `web/app/not-found.tsx` — página 404 con link a `/vault`
- `web/app/error.tsx` — error boundary global con botón "Reintentar"

### 3. Verificar CORS en producción
El CORS del backend está configurado con `FRONTEND_URL` desde env. Verificar que `https://gitvault.dudiver.net` esté correctamente en la lista de orígenes permitidos.

### 4. Migración automática en startup
Verificar que `dbContext.Database.MigrateAsync()` se ejecuta al inicio del contenedor antes de aceptar tráfico, especialmente en primera ejecución con volumen SQLite vacío.

## Evidence In Repo

- `web/next.config.ts` — pendiente `output: "standalone"`
- `web/Dockerfile` — ya referencia `.next/standalone`
- `src/GitVault.Api/Program.cs` — CORS config
