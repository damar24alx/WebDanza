# Audit Seguridad y Consistencia - 2026-02-22

## Baseline ejecutado

En `web/`:

1. `npm run lint` -> OK
2. `npx tsc --noEmit` -> OK
3. `npm run build` -> OK
4. `npm run test:integration` -> OK (41/41)
5. `npm run test:smoke` -> OK (43/43)
6. `npm audit --omit=dev` -> 0 vulnerabilidades runtime

## Hallazgos y estado

### P0

1. Fuga de progreso anonimo en catalogo (se mostraba progreso de otro usuario): **CERRADO**
   - Fix: `web/src/server/db/catalog.ts`
   - Prueba: `web/tests/integration/catalog.integration.test.ts` (anti-leak)

### P1

1. Flujos auth simulados (register/recovery): **CERRADO**
   - `web/src/app/api/auth/register/route.ts`
   - `web/src/app/api/auth/recovery/request/route.ts`
   - `web/src/app/auth/register/page.tsx`
   - `web/src/app/auth/recovery/page.tsx`

2. UX de errores sin preservacion de datos: **CERRADO (auth)**
   - Login/register/recovery preservan campos no sensibles.
   - Passwords no se reinyectan en UI.

3. Login sin limite de intentos: **CERRADO**
   - `web/src/server/security/rate-limit.ts`
   - `web/src/app/api/auth/login/route.ts`

4. Mutaciones sin hardening CSRF base: **CERRADO**
   - `web/src/server/security/csrf.ts`
   - aplicado en admin/auth/progress routes
   - test cross-origin: `web/tests/integration/access-control.integration.test.ts`

5. URL de citations sin validacion estricta: **CERRADO**
   - `web/src/server/validation/url.ts`
   - aplicado en `admin-citations`, `admin-moves`, `admin-taxonomy`
   - test: `web/tests/integration/admin-citations.integration.test.ts`

### P2

1. Integridad de `UserProgress`/`Connection`: **CERRADO (DB-level)**
   - migracion:
     - `web/prisma/migrations/20260222154500_harden_user_progress_uniques_and_connection_strength/migration.sql`
   - schema:
     - `web/prisma/schema.prisma`
   - repo:
     - `web/src/server/db/progress.ts`

2. Security headers en app: **CERRADO**
   - `web/next.config.ts`

3. Deriva documental (NextAuth/middleware): **CERRADO**
   - `docs/PROJECT_BRIEF.md`
   - `docs/REPO_PLAN.md`
   - `docs/ADR/0001-stack.md`
   - `docs/ADR/0004-auth-and-admin-access.md`

## Riesgos residuales

1. Rate limit en memoria (single-instance) no distribuido.
2. Recovery MVP aun sin envio de email ni token de reset persistente.
3. Admin forms aun dependen de errores por redirect string (sin contrato JSON uniforme en todas las rutas).
4. Dependencias dev (`npm audit`) mantienen alertas en cadena de lint (`minimatch` via eslint stack).

## Recomendacion inmediata

1. Implementar recovery completo con token persistente + endpoint de reset.
2. Estandarizar contrato `fieldErrors/formError` en todos los POST admin/progress.
3. Evaluar rate limit distribuido (Redis) antes de produccion.
4. Plan de actualizacion de toolchain de lint para cerrar vulnerabilidades dev.

## Actualizacion 2026-02-23

Estado de recomendaciones anteriores:
1. Recovery completo con token persistente + reset: **CERRADO**
2. Contrato `fieldErrors/formError` en admin/progress: **CERRADO**
3. Rate limit distribuido (Redis): **PENDIENTE**
4. Actualizacion de toolchain lint: **PENDIENTE**

Evidencia tecnica agregada:
1. `web/prisma/schema.prisma` + migracion `20260222173500_add_password_reset_tokens`
2. `web/src/server/auth/password-reset.ts`
3. `web/src/server/validation/admin.ts`
4. `web/src/server/validation/progress.ts`
5. `web/src/app/api/certificates/verify/[code]/route.ts`
6. `web/tests/integration/route-validation.integration.test.ts`
7. `web/tests/integration/certificates.integration.test.ts`
8. `web/tests/integration/auth.integration.test.ts` (token expirado)

Gates actualizados:
1. `npm run lint` -> OK
2. `npx tsc --noEmit` -> OK
3. `npm run build` -> OK
4. `npm run test:integration` -> OK (51/51)
5. `npm run test:smoke` -> OK (43/43)

## Actualizacion 2026-02-23 - Cierre P0 + E4 + E6

Baseline tecnico de esta iteracion:
1. `npm run lint` -> OK
2. `npx tsc --noEmit` -> OK
3. `npm run build` -> OK
4. `npm run test:integration` -> OK (57/57)
5. `npm run test:smoke` -> OK (43/43)

Cambios de seguridad aplicados:
1. Catalogo publico:
   - no expone lessons no publicadas dentro de cursos publicados.
2. Progreso:
   - gating real por checklist persistente.
   - API de checklist con validacion server-side y control de acceso.
3. Certificados:
   - endpoint verify sin IDs internos en respuesta publica.
4. CSP:
   - `unsafe-eval` solo en desarrollo; removido en produccion.
5. Rate limiting:
   - login y recovery request con `Retry-After` y contrato consistente.
6. Observabilidad:
   - logging estructurado en auth/admin/progress/certificates.
   - endpoint `/api/health` con chequeo de DB.

Riesgos residuales:
1. Rate limit sigue en memoria (no distribuido).
2. Falta instrumentacion real de Web Vitals en cliente para correlacion completa de performance+errores.

## Actualizacion 2026-02-23 (lote E1-S4 + E3-S4)

Baseline tecnico de esta iteracion:
1. `npm run lint` -> OK
2. `npx tsc --noEmit` -> OK
3. `npm run build` -> OK
4. `npm run test:integration` -> OK (61/61)
5. `npm run test:smoke` -> OK (44/44)

Cambios con impacto de robustez:
1. Validacion admin de citations ahora cubre `entityType=connection`:
   - `web/src/server/validation/admin.ts`
2. Repo de citations soporta conexion segura por UUID para `connection`:
   - `web/src/server/db/admin-citations.ts`
3. Test de integracion anti-regresion para citation en `connection`:
   - `web/tests/integration/admin-citations.integration.test.ts`

## Actualizacion 2026-02-23 (E5-S4 + E6-S5 + hardening operacional)

Baseline tecnico de esta iteracion:
1. `npm run lint` -> OK
2. `npx tsc --noEmit` -> OK
3. `npm run build` -> OK
4. `npm run test:integration` -> OK (68/68)
5. `npm run test:smoke` -> OK (45/45)

Cambios de seguridad/operacion aplicados:
1. Rate limit compartido en DB:
   - nuevo modelo `RateLimitEntry` + migracion.
   - `web/src/server/security/rate-limit.ts` usa DB con fallback memoria.
2. Endurecimiento de pruebas auth:
   - limpieza de buckets en `auth.integration` para evitar estado residual.
3. Observabilidad cliente:
   - `web/src/components/observability/WebVitalsReporter.tsx`
   - endpoint validado `POST /api/observability/web-vitals` con CSRF same-origin y schema `zod`.

Riesgos residuales:
1. Store de rate-limit en DB funciona para multi-instancia, pero para alto volumen puede requerir Redis por latencia/throughput.
2. Web vitals se capturan en cliente y se loguean; aun no existe backend de agregacion/series temporales dedicado.

## Actualizacion 2026-02-23 (E4-S5 + E5-S5 + Redis rate-limit)

Baseline tecnico de esta iteracion:
1. `npm run lint` -> OK
2. `npx tsc --noEmit` -> OK
3. `npm run build` -> OK
4. `npm run test:integration` -> OK (73/73)
5. `npm run test:smoke` -> OK (46/46)

Cambios de seguridad/operacion aplicados:
1. Rate-limit distribuido en Redis con fallback seguro:
   - cadena activa `Redis -> DB -> memoria` en `web/src/server/security/rate-limit.ts`.
   - prueba de fallback: `web/tests/integration/rate-limit-redis.integration.test.ts`.
2. Certificados admin endurecidos:
   - estado `active/revoked` y bitacora `CertificateEvent` en DB.
   - API admin protegida para revocacion/reemision con trazabilidad.
3. Estabilidad operativa de smoke:
   - ejecución sobre servidor de produccion (`build + start`) sin recarga caliente.
   - sesion de pruebas consistente con `AUTH_SECRET` dedicado.

Estado de recomendaciones previas:
1. Recovery completo con token persistente + reset: **CERRADO**
2. Contrato `fieldErrors/formError` en admin/progress: **CERRADO**
3. Rate limit distribuido (Redis): **CERRADO**
4. Actualizacion de toolchain lint: **PENDIENTE**

Riesgos residuales:
1. Redis queda opcional por configuracion; si no hay `REDIS_URL`, el sistema cae a DB/memoria (seguro, pero con menor throughput).
2. Falta pipeline historico dedicado para agregacion de web vitals/errores en produccion.

## Actualizacion 2026-02-23 (hardening de produccion + DB)

Baseline tecnico de esta iteracion:
1. `npm run lint` -> OK
2. `npx tsc --noEmit` -> OK
3. `npm run build` -> OK
4. `npm run test:integration` -> OK (78/78)
5. `npm run test:smoke` -> OK (46/46)
6. `npm audit --omit=dev` -> OK (0 vulnerabilidades runtime)
7. scripts de integridad:
   - `npm run db:audit-integrity` -> OK
   - `npm run db:repair-integrity` (dry-run) -> OK

Cambios de seguridad aplicados:
1. CSP endurecida sin `frame-src` externo:
   - `web/next.config.ts`.
2. Health endpoint con DB + Redis:
   - `web/src/app/api/health/route.ts`.
3. Media lifecycle endurecido:
   - upload via adapter centralizado.
   - cleanup de media huérfana en unlink.
4. Integridad DB reforzada:
   - check `stepIndex >= 0` en `UserLessonStepProgress`.
   - check `durationSec >= 0` en `Media`.
   - check de consistencia `Certificate.status` vs `revokedAt`.
5. Operacion:
   - CI de gates de produccion en `.github/workflows/ci.yml`.
   - `.env.example` ampliado.

Riesgos residuales:
1. Secret manager y rotacion central de secretos aun dependen de infraestructura externa.
2. Observabilidad central (APM/logs agregados) pendiente de proveedor productivo.
3. Adapter cloud de media preparado pero no implementado para S3/R2 real.

## Actualizacion 2026-02-23 (cierre P0 externo y operacion productiva)

Baseline tecnico de esta iteracion:
1. `npm run lint` -> OK
2. `npx tsc --noEmit` -> OK
3. `npm run build` -> OK
4. pruebas de integracion clave:
   - `access-control.integration` -> OK
   - `admin-media-upload.integration` -> OK
   - `logger-observability.integration` -> OK

Cambios de seguridad/operacion aplicados:
1. Secret manager check operativo:
   - `web/scripts/ops/secret-manager-check.ts`
   - reporte: `docs/PRODUCTION_SECRET_MANAGER_CHECK_2026-02-23.md`
2. Backup/restore drill operativo:
   - `web/scripts/ops/backup-restore-drill.ts`
   - reporte: `docs/PRODUCTION_BACKUP_RESTORE_DRILL_2026-02-23.md`
3. Cloud media adapter real:
   - `web/src/server/media/storage.ts` con `PutObject/DeleteObject`.
4. Rate limit admin mutaciones:
   - `web/src/app/api/admin/_shared.ts` con `429 + Retry-After`.
5. Observabilidad central:
   - `web/src/server/observability/logger.ts` con forward HTTP + webhook alertas.

Estado de recomendaciones:
1. Recovery completo con token persistente + reset: **CERRADO**
2. Contrato `fieldErrors/formError` en admin/progress: **CERRADO**
3. Rate limit distribuido (Redis): **CERRADO**
4. Secret manager + backup/restore + observabilidad central: **CERRADO (nivel implementacion y evidencia local)**
5. Actualizacion de toolchain lint: **PENDIENTE**
