# ADR 0004 - Session-based Auth and Admin Access Control

- Fecha: 2026-02-22
- Estado: Aceptado
- Contexto: el panel admin y endpoints internos aceptaban rol desde query/form (`actorRole`), lo que abria riesgo de elevacion por input manipulable.

## Decision

1. El rol efectivo se obtiene solo desde sesion autenticada de servidor (cookie firmada).
2. Se protege `/admin/*` y `/api/admin/*` en `proxy.ts`:
   - sin sesion -> redirect login (UI) o `401` (API)
   - sesion no ADMIN -> redirect `/me` (UI) o `403` (API)
3. Los endpoints admin usan `requireAdminApiAccess` y no confian en query/body para permisos.
4. La UI elimina inputs `actorRole` y elimina switching de rol por query en pantallas admin.
5. Navegacion: enlace `Admin` visible solo para usuarios `ADMIN`.
6. Mutaciones sensibles aplican validacion de same-origin (`Origin/Referer`) como hardening CSRF base.

## Consecuencias

Positivas:
- Se elimina vector directo de escalamiento por parametro manipulable.
- Reglas de autorizacion centralizadas y consistentes entre UI/API.
- Mejor separacion de paneles (`ADMIN -> /admin`, `STUDENT -> /me`).

Costos:
- Flujo de login/sesion requerido para operar paneles protegidos.
- Tests de acceso deben validar `proxy.ts`, guard server-side y bloqueo cross-origin.

## Implementacion relacionada

- `web/src/server/auth/*`
- `web/src/proxy.ts`
- `web/src/server/security/csrf.ts`
- `web/src/app/api/admin/_shared.ts`
- `web/src/components/layout/Navbar.tsx`
- `web/tests/integration/access-control.integration.test.ts`

