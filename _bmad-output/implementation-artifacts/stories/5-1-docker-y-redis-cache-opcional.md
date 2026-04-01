# Story 5.1: Docker y Redis Cache Opcional

## Outcome

El sistema puede desplegarse con `docker compose up --build`. Redis se activa automáticamente cuando `Redis:ConnectionString` está presente en la configuración — sin ese valor el sistema usa `IMemoryCache` sin cambiar ningún código. El mismo `ICacheService` funciona con ambos backends.

## Evidence In Repo

- `docker-compose.yml` — services: redis, api, web
- `Dockerfile.api` — multi-stage .NET 10 build
- `web/Dockerfile` — multi-stage Next.js build con standalone
- `src/GitVault.Infrastructure/Cache/CacheServiceExtensions.cs` — `AddGitVaultCache()`
- `src/GitVault.Infrastructure/Cache/RedisCacheService.cs` — degradación graceful
- `src/GitVault.Infrastructure/Cache/MemoryCacheService.cs`

## Notes

Redis tiene degradación graceful: cualquier error de Redis se loguea como warning y se trata como cache miss, nunca como error fatal. El health check del API usa `/healthz` con checks de DB y Redis. `RedisCacheService` serializa/deserializa con `System.Text.Json`.
