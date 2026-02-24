# MVP Status Matrix

Fecha de corte: 2026-02-23
Objetivo: visualizar avance real de historias Must para cerrar la primera version funcional.

## Resumen numerico

- Historias Must totales: 24
- Cerradas: 24
- Parciales: 0
- Pendientes: 0
- Cierre estimado actual: 100% completo, 0% parcial, 0% pendiente

## Matriz por historia Must

| ID | Historia | Estado | Evidencia actual | Cierre para marcar DONE |
|---|---|---|---|---|
| E1-S1 | Arquitectura navegacion principal | DONE | Rutas core implementadas y auditadas | Sin accion |
| E1-S2 | Listado de estilos con filtros base | DONE | `/styles` con filtros + empty | Sin accion |
| E1-S3 | Pagina detalle Style | DONE | `/styles/[slug]` funcional | Sin accion |
| E1-S4 | Busqueda global MVP | DONE | Ruta `/search` con resultados agrupados cross-entity + test de integracion dedicado | Sin accion |
| E2-S1 | Prisma schema v1 | DONE | `schema.prisma` completo | Sin accion |
| E2-S2 | Migraciones iniciales Postgres | DONE | migraciones aplicadas local | Sin accion |
| E2-S3 | Seed MVP inicial | DONE | seed idempotente ejecutado | Sin accion |
| E2-S4 | Admin CRUD minimo Style/Substyle/Move | DONE | CRUD + archive + status + acceso admin por sesion/middleware | Sin accion |
| E2-S5 | Guardrails editoriales | DONE | placeholder/citation/rightsstatus en publish flow | Sin accion |
| E3-S1 | Listado de Moves con tags | DONE | `/moves` con filtros/tags y empty | Sin accion |
| E3-S2 | Detalle de Move tecnica paso a paso | DONE | `/moves/[slug]` + sections core | Sin accion |
| E3-S3 | Integracion Media interna | DONE | backend + UI admin media + render publico con fallback (`unknown/restricted/blocked`) + tests | Sin accion |
| E3-S4 | Gestion de Citation y Source | DONE | citation activa en style/substyle/move/lesson/course/connection + formulario admin para lesson/course/connection | Sin accion |
| E4-S1 | Vista Lesson con checklist | DONE | checklist por paso persistente + UI interactiva en `/learn/[courseSlug]` | Sin accion |
| E4-S2 | Ruta Course secuenciada | DONE | gating secuencial real por completitud de checklist | Sin accion |
| E4-S3 | Persistencia UserProgress | DONE | recalculo determinista lesson/course + sync de `UserProgress` | Sin accion |
| E4-S4 | Continuar donde quedaste | DONE | reanudacion exacta con `resumeLessonSlug` + `resumeStepIndex` | Sin accion |
| E5-S1 | Regla elegibilidad certificado | DONE | reglas `all_lessons` y `percent_90` activas en backend | Sin accion |
| E5-S2 | Emision Certificate con codigo unico | DONE | emision automatica activa + no duplicacion `userId+courseId` | Sin accion |
| E5-S3 | Vista certificado MVP | DONE | verificacion por pagina y API publica (`/api/certificates/verify/[code]`) | Sin accion |
| E6-S1 | Metadatos SEO por entidad | DONE | metadata dinamica por entidad clave (`styles`, `moves`, `learn/course`) | Sin accion |
| E6-S2 | Sitemap y robots MVP | DONE | `sitemap.xml` published-only + `robots.txt` con bloqueo admin | Sin accion |
| E6-S3 | Presupuesto performance base | DONE | presupuesto documentado en `docs/PERFORMANCE_BUDGET.md` | Sin accion |
| E6-S4 | Observabilidad minima | DONE | `/api/health` + logging estructurado en rutas criticas | Sin accion |

## Hardening transversal reciente

1. CSRF base con validacion same-origin (`Origin/Referer`) en mutaciones sensibles.
2. Login con rate limit por IP y cuenta.
3. Registro real (`/api/auth/register`) y recuperacion no simulada (`/api/auth/recovery/request`).
4. Correccion de fuga de progreso anonimo en catalogo.

## Bloques de trabajo restantes para MVP

1. Ninguno (historias Must cerradas).

## Criterio de cierre MVP

MVP funcional se considera cerrado cuando:
- 24/24 historias Must estan en DONE
- checklist `docs/DEFINITION_OF_DONE.md` se cumple para release
- flujos `explorar -> aprender -> progreso -> certificado` funcionan end-to-end

## Actualizacion 2026-02-23 (hardening + certificados)

Recuento actualizado:
- Historias Must totales: 24
- DONE: 14
- PARTIAL: 6
- PENDING: 4

Cambios de estado relevantes:
1. `E5-S1` -> **DONE**
   - Regla de elegibilidad aplicada en backend (`all_lessons` y `percent_90`).
2. `E5-S2` -> **DONE**
   - Emision automatica activa y sin duplicados por `userId+courseId`.
3. `E5-S3` -> **DONE**
   - Vista de certificado + verificacion publica por pagina y API (`/api/certificates/verify/[code]`).
4. Hardening transversal:
   - Validaciones admin/progress estandarizadas con `422 + fieldErrors/formError`.
   - Recovery/reset password con token persistente, expiracion y consumo unico.

## Actualizacion 2026-02-23 (cierre P0 + E4 + E6 + hardening corto)

Recuento actualizado:
- Historias Must totales: 24
- DONE: 22
- PARTIAL: 2
- PENDING: 0

Cambios de estado relevantes:
1. `E4-S1` -> **DONE**
   - Checklist por paso persistente (`UserLessonStepProgress`) con UI interactiva.
2. `E4-S2` -> **DONE**
   - Gating secuencial real (solo siguiente leccion activa, resto bloqueadas).
3. `E4-S3` -> **DONE**
   - Recalculo determinista lesson/course + sincronizacion de `UserProgress`.
4. `E4-S4` -> **DONE**
   - Reanudacion exacta por `resumeLessonSlug` + `resumeStepIndex` en `/learn` y `/me`.
5. `E6-S1` -> **DONE**
   - `generateMetadata` por entidad en `styles/[slug]`, `moves/[slug]`, `learn/[courseSlug]`.
6. `E6-S2` -> **DONE**
   - `sitemap.ts` y `robots.ts` publicados con filtro `published` y bloqueo admin.
7. `E6-S3` -> **DONE**
   - Presupuesto y seguimiento formal en `docs/PERFORMANCE_BUDGET.md`.
8. `E6-S4` -> **DONE**
   - `/api/health` + logging estructurado en auth/admin/progress/certificates.

Hardening transversal de este lote:
1. Contrato de verificacion de certificados endurecido (sin IDs internos expuestos).
2. CSP endurecida sin `unsafe-eval` en produccion.
3. Rate limit consistente en login y recovery request con `Retry-After`.

## Actualizacion 2026-02-23 (cierre E1-S4 + E3-S4)

Recuento actualizado:
- Historias Must totales: 24
- DONE: 24
- PARTIAL: 0
- PENDING: 0

Cambios de estado relevantes:
1. `E1-S4` -> **DONE**
   - Busqueda global cross-entity activa en `/search`.
   - Resultados agrupados por `style/move/course/lesson`.
   - Evidencia: `web/src/server/db/search.ts`, `web/src/app/search/page.tsx`, `web/tests/integration/search.integration.test.ts`.
2. `E3-S4` -> **DONE**
   - Link de citation extendido a `connection`.
   - Validaciones admin aceptan `entityType=connection`.
   - UI admin agregada para vincular citation a `lesson/course/connection`.
   - Evidencia: `web/src/server/db/admin-citations.ts`, `web/src/server/validation/admin.ts`, `web/src/app/admin/page.tsx`, `web/tests/integration/admin-citations.integration.test.ts`.

Gates ejecutados en esta iteracion:
1. `npm run lint` -> OK
2. `npx tsc --noEmit` -> OK
3. `npm run build` -> OK
4. `npm run test:integration` -> OK (61/61)
5. `npm run test:smoke` -> OK (44/44)

## Actualizacion 2026-02-23 (nice-to-have: E5-S4 + E6-S5 + hardening operacional)

Historias Nice-to-have cerradas en este lote:
1. `E5-S4` -> **DONE**
   - Logros MVP deterministas activos en backend.
   - UI real en `/me` y `/me/achievements` sin mocks estaticos.
   - Evidencia: `web/src/server/db/achievements.ts`, `web/src/app/me/page.tsx`, `web/src/app/me/achievements/page.tsx`, `web/tests/integration/achievements.integration.test.ts`.
2. `E6-S5` -> **DONE**
   - Panel de KPIs MVP activo en `/admin/kpis`.
   - Metricas: activacion 24h, retencion semana 1, completion de cursos.
   - Evidencia: `web/src/server/db/kpis.ts`, `web/src/app/admin/kpis/page.tsx`, `web/tests/integration/kpis.integration.test.ts`.

Hardening operacional adicional:
1. Rate limit con store compartido en DB (`RateLimitEntry`) y fallback seguro en memoria.
2. Observabilidad cliente con captura de Web Vitals hacia `/api/observability/web-vitals`.
3. Evidencia: `web/src/server/security/rate-limit.ts`, `web/prisma/schema.prisma`, `web/prisma/migrations/20260223101500_add_rate_limit_entries/migration.sql`, `web/src/components/observability/WebVitalsReporter.tsx`, `web/src/app/api/observability/web-vitals/route.ts`.

Gates ejecutados en esta iteracion:
1. `npm run lint` -> OK
2. `npx tsc --noEmit` -> OK
3. `npm run build` -> OK
4. `npm run test:integration` -> OK (68/68)
5. `npm run test:smoke` -> OK (45/45)

## Actualizacion 2026-02-23 (nice-to-have: E4-S5 + E5-S5 + rate-limit Redis)

Historias Nice-to-have cerradas en este lote:
1. `E4-S5` -> **DONE**
   - tablero de progreso por estilo activo en `/me`.
   - evidencia: `web/src/server/db/profile.ts`, `web/src/app/me/page.tsx`, `web/tests/integration/profile-style-progress.integration.test.ts`.
2. `E5-S5` -> **DONE**
   - admin puede revocar y reemitir certificados con historial de eventos.
   - evidencia: `web/prisma/schema.prisma`, `web/src/server/db/admin-certificates.ts`, `web/src/app/admin/certificates/page.tsx`, `web/tests/integration/admin-certificates.integration.test.ts`.

Hardening operacional adicional:
1. Rate-limit distribuido con Redis y fallback `Redis -> DB -> memoria`.
2. Smoke/design audit estabilizados sobre servidor de produccion para reducir falsos negativos.
3. Evidencia: `web/src/server/security/rate-limit.ts`, `web/tests/integration/rate-limit-redis.integration.test.ts`, `web/playwright.config.ts`, `web/tests/smoke.spec.ts`, `web/tests/design-audit.spec.ts`.

Gates ejecutados en esta iteracion:
1. `npm run lint` -> OK
2. `npx tsc --noEmit` -> OK
3. `npm run build` -> OK
4. `npm run test:integration` -> OK (73/73)
5. `npm run test:smoke` -> OK (46/46)

## Actualizacion 2026-02-23 (go-live hardening E7)

Estado de EPICA 7 (produccion):
1. `E7-S1` checklist go-live -> **DONE**
2. `E7-S2` runbook operativo -> **DONE**
3. `E7-S3` integridad DB + scripts audit/repair -> **DONE**
4. `E7-S4` CI con gates de produccion -> **DONE**
5. `E7-S5` infraestructura externa (secret manager, observabilidad central, backup/restore real) -> **PARTIAL**

Evidencia:
1. `docs/PRODUCTION_GO_LIVE_CHECKLIST.md`
2. `docs/PRODUCTION_READINESS_REPORT_2026-02-23.md`
3. `docs/PRODUCTION_RUNBOOK.md`
4. `docs/DATABASE_ARCHITECTURE.md`
5. `.github/workflows/ci.yml`
6. `web/scripts/db/audit-integrity.ts`
7. `web/scripts/db/repair-integrity.ts`

## Actualizacion 2026-02-23 (cierre E7-S5 + readiness final)

Estado EPICA 7:
1. `E7-S1` checklist go-live -> **DONE**
2. `E7-S2` runbook operativo -> **DONE**
3. `E7-S3` integridad DB + scripts -> **DONE**
4. `E7-S4` CI de produccion -> **DONE**
5. `E7-S5` secret manager + observabilidad central + backup/restore drill -> **DONE**

Evidencia adicional:
1. `web/scripts/ops/secret-manager-check.ts`
2. `docs/PRODUCTION_SECRET_MANAGER_CHECK_2026-02-23.md`
3. `web/scripts/ops/backup-restore-drill.ts`
4. `docs/PRODUCTION_BACKUP_RESTORE_DRILL_2026-02-23.md`
5. `web/src/server/observability/logger.ts`
6. `web/tests/integration/logger-observability.integration.test.ts`

Estado de readiness:
- `PRODUCTION_READY = YES` (con checklist tecnico en `DONE` y gates en verde).
