# Epics And Stories: GitVault

## Epic 1: Core Storage Engine

Implementar el motor de almacenamiento content-addressable sobre GitHub: blobs, deduplicación SHA-256, batch upload via Git Data API, y tokens de instalación cacheados.

### Story 1.1: GitHub App Auth e Installation Tokens

Como sistema, quiero autenticarme en GitHub via GitHub App y cachear installation tokens por 55 minutos para no exceder el rate limit.

### Story 1.2: CAS Blob Upload via Git Data API

Como usuario, quiero subir archivos y que se almacenen como blobs en `/objects/{ab}/{cd}/{sha256}` usando el Git Data API (N archivos = N+3 llamadas API).

### Story 1.3: Deduplicación y Verificación SHA-256

Como sistema, quiero detectar blobs existentes antes de subirlos y reutilizarlos automáticamente para ahorrar espacio y llamadas API.

---

## Epic 2: Identity And Access Management

Implementar el sistema de identidad completo: Firebase JWT, API keys con bcrypt, public_id derivado por HMAC, y el state token CSRF-safe para el OAuth flow.

### Story 2.1: Firebase JWT Authentication

Como usuario, quiero autenticarme con email/password via Firebase y que el backend valide mi idToken para proteger todos los endpoints.

### Story 2.2: App API Keys y Credentials

Como developer, quiero crear aplicaciones con scopes específicos y generar credenciales api_key:api_secret para acceso programático, con el secreto hasheado en bcrypt.

### Story 2.3: HMAC Public ID y SERVER_SECRET

Como sistema, quiero derivar public_ids no-guessables usando HMAC-SHA256(logical_id, SERVER_SECRET) para que las URLs de archivos privados no sean predecibles.

---

## Epic 3: File Serving And Metadata

Implementar el sistema de serving dual (CDN redirect para públicos, stream backend para privados), dual-write de metadata a SQLite+GitHub, y caché con negative cache.

### Story 3.1: Dual-Write Metadata SQLite y GitHub

Como sistema, quiero escribir metadata de archivos en SQLite (primario, rápido) y en el repo GitHub en `/meta/` (secundario, backup) de forma asíncrona (fire-and-forget).

### Story 3.2: Serving Público via CDN Redirect

Como usuario anónimo, quiero acceder a `/f/{publicId}` y recibir un 302 redirect a `raw.githubusercontent.com` para servir archivos públicos sin consumir rate limit del API.

### Story 3.3: Serving Privado con Autenticación

Como usuario autenticado, quiero acceder a archivos privados via Bearer token Firebase o Basic api_key:api_secret, y que el backend los stream directamente desde GitHub.

---

## Epic 4: Web Dashboard

Construir el frontend Next.js completo: auth flow, onboarding GitHub, vault explorer con upload drag-and-drop, y gestión de apps/credenciales.

### Story 4.1: Auth Flow (Login, Register, Onboarding)

Como usuario nuevo, quiero registrarme con email/password, conectar mi GitHub App, y completar el onboarding antes de acceder al dashboard.

### Story 4.2: Vault Explorer

Como usuario, quiero ver mis vaults, subir archivos con drag-and-drop, copiar URLs, cambiar visibilidad y eliminar archivos desde el dashboard.

### Story 4.3: Apps y Credentials Management

Como developer, quiero crear aplicaciones con scopes, generar credenciales API y revocarlas desde el dashboard, con reveal único del secreto al crearlo.

---

## Epic 5: Infrastructure And Production

Resolver bugs de contrato API, configurar Docker para producción, y asegurar que el sistema esté listo para despliegue real.

### Story 5.1: Docker y Redis Cache Opcional

Como operador, quiero desplegar con `docker compose up` y que Redis se active automáticamente si está disponible, sin cambiar código.

### Story 5.2: Contrato API Frontend-Backend

Como frontend, quiero que los campos de la API coincidan con los tipos TypeScript del cliente (snake_case del backend mapeado correctamente) y que el onboarding flow use el state HMAC del backend.

### Story 5.3: Producción y CORS

Como operador, quiero configurar CORS para el dominio de producción, el `output: standalone` de Next.js para Docker, y las páginas de error (not-found, error boundary).
