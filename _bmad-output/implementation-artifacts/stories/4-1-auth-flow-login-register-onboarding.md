# Story 4.1: Auth Flow (Login, Register, Onboarding)

## Outcome

El usuario puede registrarse o iniciar sesión con email/password via Firebase. Tras autenticarse, si no tiene GitHub conectado se redirige a `/onboarding` donde instala la GitHub App. El `(auth)` route group guarda la sesión y redirige automáticamente según estado: sin user → `/login`, sin GitHub → `/onboarding`, ok → dashboard.

## Evidence In Repo

- `web/components/auth-context.tsx` — AuthContext + AuthProvider
- `web/components/providers.tsx` — QueryClient + AuthProvider
- `web/app/(auth)/layout.tsx` — auth guard
- `web/app/(public)/login/page.tsx`
- `web/app/(public)/register/page.tsx`
- `web/app/onboarding/page.tsx`
- `web/app/github/callback/page.tsx`

## Notes

El `AuthContext` llama a `GET /v1/auth/me` al detectar cambio de estado Firebase para obtener `github_connected`. El callback de GitHub usa `Suspense` alrededor de `useSearchParams()` para cumplir con los requisitos de Next.js 16 (static generation). El flujo de onboarding pendiente de corrección: debe llamar a `POST /v1/auth/connect-github` para obtener la URL con state HMAC firmado.
