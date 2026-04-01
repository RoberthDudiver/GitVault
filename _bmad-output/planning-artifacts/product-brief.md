# Product Brief: GitVault

## Visión

GitVault es una plataforma SaaS que convierte repositorios de GitHub en backends de almacenamiento inteligente de archivos. Los usuarios conectan sus propios repos, suben archivos y obtienen URLs públicas o privadas con autenticación — sin pagar por almacenamiento externo y sin perder control de sus datos.

## Problema

Los desarrolladores y equipos pequeños necesitan almacenamiento de archivos con URLs servibles, pero las soluciones existentes (S3, Cloudinary, Supabase Storage) requieren tarjeta de crédito, tienen costes variables y los datos quedan en manos de terceros. GitHub ya existe en el workflow de cualquier developer — los repos son gratis, versionados y de confianza.

## Usuarios Objetivo

- Desarrolladores indie que necesitan hosting de assets para sus proyectos
- Equipos pequeños que ya usan GitHub y quieren storage sin fricción
- Integradores que necesitan API programática con credenciales de app

## Propuesta de Valor

- **Cero coste de almacenamiento** — usa el storage gratuito de GitHub
- **Content-Addressable Storage (CAS)** — deduplicación automática por SHA-256
- **URLs inmutables** — `public_id` derivado por HMAC-SHA256, no guessable
- **GitHub App** — no requiere PAT, permisos granulares por instalación
- **Redis opcional** — mismo código, performance escalable cuando se necesita
- **Open source** — el algoritmo es público; la seguridad viene del SERVER_SECRET

## Arquitectura Central

```
Usuario → Firebase Auth → .NET API → GitHub App → Repo (CAS blobs)
                                   ↓
                              SQLite (metadata primario)
                              GitHub repo /meta/ (backup)
                                   ↓
                         /f/{publicId} → CDN redirect (público)
                                       → stream backend (privado)
```

## Stack Técnico

- **Backend**: .NET 10, ASP.NET Core, EF Core + SQLite, Octokit.NET
- **Frontend**: Next.js 16, React 19, TanStack Query, Tailwind CSS v4
- **Auth**: Firebase Authentication (JWT) + Basic api_key:api_secret
- **Cache**: Redis (opcional) / IMemoryCache (default)
- **Deploy**: Docker Compose, stateless API, SQLite en volumen

## Modelo de Seguridad

- `SERVER_SECRET` como raíz de confianza (HMAC-SHA256)
- `public_id` = HMAC(logical_id, SERVER_SECRET)[0:12] base62 — no guessable sin el secreto
- `api_secret` hasheado con bcrypt (work factor 12) — nunca almacenado en claro
- Webhook signatures verificadas con HMAC-SHA256
- Algoritmo open source — seguridad por secreto, no por oscuridad

## Restricciones MVP

- Sin base de datos de pago (SQLite)
- Sin almacenamiento local de archivos (todo va a GitHub)
- Stateless (Redis opcional, no requerido)
- GitHub App (no PAT)
- Máximo 10 MB por archivo, 20 archivos por batch
