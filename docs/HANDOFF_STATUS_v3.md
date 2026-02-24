# HANDOFF v3 - Proyecto Danza (actualizado para cierre de Fase 1B)

Fecha: 2026-02-22
Repo local: `C:\Users\User\Desktop\proyecto-danza`
App: `web/` (Next.js App Router + Tailwind + Prisma + PostgreSQL)

## 0) Estado general

- Fase 0 (documentacion): cerrada.
- Fase 0.5 (export Stitch): cerrada.
- Fase 1A (UI estatica): cerrada funcionalmente.
- Fase 1A.1 (hardening funcional de frontend): cerrada.
- Fase 1B (DB + Prisma + Seeds + admin minimo): **cerrada y endurecida en seguridad/acceso**.

Referencias:
- `docs/PHASE1A_CLOSEOUT.md`
- `docs/PHASE1A_AUDIT.md`
- `docs/PHASE1A_UI_PARITY_CHECKLIST.md`
- `docs/PHASE1B_BOOTSTRAP.md`
- `docs/MVP_STATUS_MATRIX.md`
- `docs/MVP_EXECUTION_PLAN.md`
- `docs/SPRINT_01_PLAN.md`
- `docs/AUDIT_SECURITY_2026-02-22.md`

## 1) Cierre 1A/1A.1 (resumen)

1. Rutas MVP core implementadas segun `design/ROUTING_MAP.md`.
2. Estados base (`loading`, `empty`, `error`, `locked`) operativos.
3. Rutas Future de Stitch implementadas:
   - `/maps/lineage`
   - `/maps/steps`
   - `/me/achievements`
4. Hardening funcional en CTAs, tabs, sidebars y controles principales.
5. Validacion tecnica base en verde:
   - `npm run lint`
   - `npm run build`
   - `npm run test:smoke`

## 2) Cierre 1B (DB + admin)

Completado en codigo:
1. Prisma schema v1 + migraciones:
   - `2026022201_init`
   - `20260222045224_add_archived_flags` (`isArchived` en `Style/Substyle/Move`)
   - `20260222065141_add_user_password_hash`
   - `20260222103000_harden_progress_connection_constraints` (checks de integridad)
   - `20260222154500_harden_user_progress_uniques_and_connection_strength` (uniques de progreso + rango `Connection.strength`)
2. Seed idempotente en `web/prisma/seed.ts`.
3. DB client singleton en `web/src/lib/db.ts`.
4. Repositorios DB-first:
   - `web/src/server/db/catalog.ts`
   - `web/src/server/db/admin-moves.ts`
   - `web/src/server/db/admin-taxonomy.ts`
5. Permisos por rol activos y acceso por sesion:
   - `web/src/server/admin/permissions.ts`
   - Auth/session:
     - `web/src/server/auth/*`
     - `web/src/proxy.ts`
     - `web/src/app/api/auth/login/route.ts`
     - `web/src/app/api/auth/logout/route.ts`
   - Endpoints admin protegidos via `requireAdminApiAccess` + proxy
   - Roles: `ADMIN`, `EDITOR`, `REVIEWER`, `STUDENT`
   - CSRF base same-origin (`Origin/Referer`) aplicado en mutaciones sensibles
6. Admin CRUD minimo operativo para `Move/Style/Substyle`:
   - UI: `/admin`, `/admin/review`, `/admin/styles`, `/admin/styles/[slug]`, `/admin/substyles`, `/admin/substyles/[slug]`
   - API: `/api/admin/moves/*`, `/api/admin/styles/*`, `/api/admin/substyles/*`
7. Guardrails editoriales operativos:
   - `PLACEHOLDER` bloquea `ready/published`
   - Claims historico-culturales sin citation bloquean `published` (style/substyle)
   - `Move` no publica con media `rightsStatus=unknown`
8. Borrado logico operativo (`isArchived`) y exclusiones activas en catalogos.
9. Catalogo publico filtrado por `published` y vistas admin con `includeUnpublished`.
10. PR-2 + PR-3 media completados:
   - UI admin media en `review/styles/substyles`
   - Render publico en `moves/[slug]` y `learn/[courseSlug]` con fallback por `rightsStatus`
11. PR-4 citations extendidas completado (lesson/course):
   - API admin citation: `/api/admin/citations/link`
   - Repositorio: `web/src/server/db/admin-citations.ts`
   - Render de sources en `web/src/app/learn/[courseSlug]/page.tsx`
12. Persistencia de progreso implementada:
   - API: `/api/progress/lessons/complete`
   - Repositorio: `web/src/server/db/progress.ts`
   - Reanudacion real en home + `/me` sobre progreso persistido
13. Hardening auth + validaciones:
   - Registro real: `/api/auth/register`
   - Recuperacion real MVP (sin envio automatico aun): `/api/auth/recovery/request`
   - Login endurecido: validaciones + mensaje unificado + rate limit por IP/cuenta
   - Capa de validacion inicial: `web/src/server/validation/*`
14. Certificados:
   - verificacion publica inicial por codigo: `/certificates/verify/[code]`
15. Seguridad de plataforma:
   - headers de seguridad base en `web/next.config.ts` (CSP, frame, nosniff, referrer-policy)
16. Correcion P0:
   - catalogo anonimo ya no expone progreso de otros usuarios

Completado en ejecucion local:
1. Postgres levantado (`docker compose up -d`).
2. Migraciones aplicadas (`npm run db:migrate` / `npx prisma migrate deploy`).
3. Seed ejecutado (`npm run db:seed`).

## 3) Validacion tecnica actual

En `web/`:
- `npm run lint` -> OK
- `npm run build` -> OK
- `npm run test:smoke` -> OK (43/43, incluye `design-audit.spec.ts`)
- `npm run test:integration` -> OK (41/41)
- `npx tsc --noEmit` -> OK

Pruebas de integracion activas:
- `web/tests/integration/access-control.integration.test.ts`
- `web/tests/integration/auth.integration.test.ts`
- `web/tests/integration/admin-citations.integration.test.ts`
- `web/tests/integration/catalog.integration.test.ts`
- `web/tests/integration/admin-moves.integration.test.ts`
- `web/tests/integration/admin-taxonomy.integration.test.ts`
- `web/tests/integration/progress.integration.test.ts`

## 4) Diferidos (no bloquean cierre 1B)

1. Pixel polish visual (workstream 1A.1).
2. Expansion de pruebas UI mas alla de smoke.
3. Consolidacion final de duplicidad `components/state` vs `components/states`.

Trazado en:
- `BACKLOG_MVP.md` -> `WORKSTREAM 1A.1: Hardening de UI post-cierre 1A`.

## 5) Siguiente paso recomendado

1. Mantener estabilizacion post-cierre Must (monitoreo de regresiones en smoke/integration).
2. Priorizar historias Nice-to-have:
   - `E4-S5` tablero simple de progreso por estilo.
   - `E5-S5` reemision/revocacion admin de certificados.
   - `E3-S5` relacionados por familia y objetivo pedagogico.
3. Fortalecer operacion para produccion:
   - rate limit distribuido (Redis) para entornos multi-region
   - observabilidad cliente (Web Vitals reales + trazas).

## 5.1) Avance Sprint 1 (2026-02-22) - Media + Acceso

Completado:
1. Modulo backend de media admin:
   - `web/src/server/db/admin-media.ts`
   - Operaciones: create, link, create+link, unlink y list por entidad.
2. Endpoints POST admin media:
   - `/api/admin/media/create`
   - `/api/admin/media/link`
   - `/api/admin/media/create-link`
   - `/api/admin/media/unlink`
3. Validaciones activas:
   - `provider`: `other` (media interna)
   - `url` valida solo rutas internas bajo `/media/...`
   - `rightsStatus` obligatorio (`unknown|ok_to_embed|restricted|blocked`)
   - `entityType` restringido a `style|substyle|move|lesson|course`
4. Permisos por rol aplicados:
   - create media -> `create_content` (Admin/Editor)
   - link/unlink media -> `edit_content` (Admin/Editor)
5. Pruebas nuevas:
   - `web/tests/integration/admin-media.integration.test.ts`
   - cobertura: validaciones, permisos y ciclo create->link->list->unlink

Validacion tecnica posterior a PR-3 + hardening de acceso:
1. `npm run lint` -> OK
2. `npx tsc --noEmit` -> OK
3. `npm run build` -> OK
4. `npm run test:integration` -> OK (31/31)
5. `npm run test:smoke` -> OK (43/43)

Completado adicional:
1. UI admin media:
   - `web/src/components/admin/AdminMediaManager.tsx`
   - `web/src/app/admin/review/page.tsx`
   - `web/src/app/admin/styles/[slug]/page.tsx`
   - `web/src/app/admin/substyles/[slug]/page.tsx`
2. Render media en detalle:
   - `web/src/components/media/ContentMediaPanel.tsx`
   - `web/src/app/moves/[slug]/page.tsx`
   - `web/src/app/learn/[courseSlug]/page.tsx`
3. Separacion de acceso validada con tests:
   - `web/tests/integration/access-control.integration.test.ts`
4. Citations lesson/course + progreso:
   - `web/src/server/db/admin-citations.ts`
   - `web/src/app/api/admin/citations/link/route.ts`
   - `web/src/server/db/progress.ts`
   - `web/src/app/api/progress/lessons/complete/route.ts`
   - `web/tests/integration/admin-citations.integration.test.ts`
   - `web/tests/integration/progress.integration.test.ts`

## 6) Nota de trazabilidad

Este archivo se mantiene como handoff operativo interno del repo, basado inicialmente en
`C:\Users\User\Downloads\HANDOFF_STATUS_v3.md` y actualizado para reflejar el cierre real de 1A/1A.1 y 1B.

## 7) Actualizacion 2026-02-23 - Lote hardening recomendado

Implementado en este lote:
1. Reset password completo:
   - Prisma: `PasswordResetToken` persistente con expiracion y consumo unico.
   - Endpoints: `/api/auth/recovery/request` y `/api/auth/recovery/reset`.
   - UI: `/auth/recovery` y `/auth/recovery/reset`.
   - Regla activa: al reset exitoso se invalidan todos los tokens activos del usuario.
2. Estandarizacion admin/progress:
   - Capa de validacion `zod` en `web/src/server/validation/admin.ts` y `web/src/server/validation/progress.ts`.
   - Contrato JSON uniforme en mutaciones admin/progress:
     - errores de validacion -> `422` con `formError` + `fieldErrors`
     - exito -> `200` con `ok: true`.
3. Certificados E2E:
   - Emision automatica por regla de curso:
     - `all_lessons` (100%)
     - `percent_90` (>=90%)
   - Sin duplicacion de certificados por `userId+courseId`.
   - Endpoint API publico de verificacion: `/api/certificates/verify/[code]`.

Pruebas y gates ejecutados tras cambios:
1. `npm run lint` -> OK
2. `npx tsc --noEmit` -> OK
3. `npm run build` -> OK
4. `npm run test:integration` -> OK (51/51)
5. `npm run test:smoke` -> OK (43/43)

Nuevas pruebas de integracion:
1. `web/tests/integration/route-validation.integration.test.ts`
2. `web/tests/integration/certificates.integration.test.ts`
3. `web/tests/integration/auth.integration.test.ts` (caso token expirado)
4. `web/tests/integration/progress.integration.test.ts` (regla `percent_90` + no duplicacion)

## 8) Actualizacion 2026-02-23 - Cierre P0 + E4 + E6 + hardening corto

Implementado en este lote:
1. P0 visibilidad lessons no publicadas:
   - Catalogo y detalle de cursos publicos filtran solo lessons `published`.
   - Cursos publicados sin lessons publicadas quedan fuera de vista publica.
   - Evidencia: `web/src/server/db/catalog.ts`, `web/tests/integration/catalog.integration.test.ts`.
2. E4 completo:
   - Persistencia granular por paso: `UserLessonStepProgress`.
   - Endpoint checklist: `/api/progress/lessons/steps/toggle`.
   - Gating real secuencial por completitud efectiva.
   - Reanudacion exacta en `/learn` y `/me` (`resumeLessonSlug`, `resumeStepIndex`).
   - Evidencia: `web/src/server/db/progress.ts`, `web/src/app/learn/[courseSlug]/page.tsx`, `web/tests/integration/progress.integration.test.ts`.
3. E6 completo:
   - SEO por entidad con `generateMetadata`:
     - `web/src/app/styles/[slug]/page.tsx`
     - `web/src/app/moves/[slug]/page.tsx`
     - `web/src/app/learn/[courseSlug]/page.tsx`
   - Indexacion:
     - `web/src/app/sitemap.ts`
     - `web/src/app/robots.ts`
   - Performance budget:
     - `docs/PERFORMANCE_BUDGET.md`
   - Observabilidad minima:
     - `web/src/app/api/health/route.ts`
     - logging estructurado en auth/admin/progress/certificates.
4. Hardening paralelo corto:
   - Cert verify API sin IDs internos:
     - `web/src/app/api/certificates/verify/[code]/route.ts`
   - CSP endurecida:
     - sin `unsafe-eval` en produccion en `web/next.config.ts`
   - Rate limit endurecido y consistente:
     - login + recovery request con `Retry-After`.
5. Idioma:
   - Se tradujeron flujos core de aprendizaje/auth/navbar a espanol.

Gates tecnicos ejecutados tras este lote:
1. `npm run lint` -> OK
2. `npx tsc --noEmit` -> OK
3. `npm run build` -> OK
4. `npm run test:integration` -> OK (57/57)
5. `npm run test:smoke` -> OK (43/43)

## 9) Actualizacion 2026-02-23 - Cierre E1-S4 + E3-S4

Implementado en este lote:
1. Busqueda global MVP cerrada (`E1-S4`):
   - repositorio de busqueda cross-entity en `web/src/server/db/search.ts`
   - pagina publica `/search` con resultados agrupados
   - navegacion conectada desde home/navbar/footer
2. Citation `connection` cerrada (`E3-S4`):
   - `entityType=connection` habilitado en validacion admin
   - linking/listing soportado por `web/src/server/db/admin-citations.ts`
   - formulario admin en `web/src/app/admin/page.tsx` para `lesson/course/connection`
   - prueba de integracion agregada para vincular citation a `connection` por ID

Validacion tecnica posterior:
1. `npm run lint` -> OK
2. `npx tsc --noEmit` -> OK
3. `npm run build` -> OK
4. `npm run test:integration` -> OK (61/61)
5. `npm run test:smoke` -> OK (44/44)

Estado consolidado:
1. Historias Must: 24/24 DONE.
2. Flujo MVP end-to-end disponible:
   - explorar contenido publicado
   - aprender con checklist/gating/reanudacion
   - progreso persistente
   - certificado verificable.

## 10) Actualizacion 2026-02-23 - E5-S4 + E6-S5 + hardening operacional

Implementado en este lote:
1. `E5-S4` logros MVP:
   - backend determinista de badges en `web/src/server/db/achievements.ts`
   - integracion real en `web/src/app/me/page.tsx` y `web/src/app/me/achievements/page.tsx`
2. `E6-S5` KPIs MVP:
   - repositorio de metricas en `web/src/server/db/kpis.ts` con cache diaria
   - panel admin en `web/src/app/admin/kpis/page.tsx`
   - navegacion admin actualizada a `/admin/kpis`
3. Hardening operacional:
   - rate limit con almacenamiento compartido DB (`RateLimitEntry`) y fallback memoria
   - nueva migracion Prisma `20260223101500_add_rate_limit_entries`
   - web vitals cliente -> endpoint `POST /api/observability/web-vitals`

Pruebas nuevas:
1. `web/tests/integration/achievements.integration.test.ts`
2. `web/tests/integration/kpis.integration.test.ts`
3. `web/tests/integration/web-vitals.integration.test.ts`

Validacion tecnica posterior:
1. `npm run lint` -> OK
2. `npx tsc --noEmit` -> OK
3. `npm run build` -> OK
4. `npm run test:integration` -> OK (68/68)
5. `npm run test:smoke` -> OK (45/45)

## 11) Actualizacion 2026-02-23 - E4-S5 + E5-S5 + Redis distribuido

Implementado en este lote:
1. `E4-S5` tablero de progreso por estilo:
   - resumen por estilo en `/me` con cursos totales/iniciados/completados.
   - backend en `web/src/server/db/profile.ts` (`getUserStyleProgressSummary`).
   - prueba: `web/tests/integration/profile-style-progress.integration.test.ts`.
2. `E5-S5` reemision/revocacion admin de certificados:
   - migracion y schema con `Certificate.status` + `CertificateEvent`.
   - rutas admin: `/api/admin/certificates/revoke` y `/api/admin/certificates/reissue`.
   - panel admin: `/admin/certificates`.
   - verificacion publica refleja estado actualizado.
   - pruebas: `web/tests/integration/admin-certificates.integration.test.ts`.
3. Rate limit distribuido en Redis con fallback:
   - `web/src/server/security/rate-limit.ts` ahora usa cadena `Redis -> DB -> memoria`.
   - dependencia `redis` agregada en `web/package.json`.
   - prueba de fallback: `web/tests/integration/rate-limit-redis.integration.test.ts`.
4. Estabilizacion smoke:
   - `web/playwright.config.ts` ejecuta smoke en `build + start`.
   - tests de smoke/design audit usan sesion firmada estable para rutas autenticadas.

Validacion tecnica posterior:
1. `npm run lint` -> OK
2. `npx tsc --noEmit` -> OK
3. `npm run build` -> OK
4. `npm run test:integration` -> OK (73/73)
5. `npm run test:smoke` -> OK (46/46)

## 12) Actualizacion 2026-02-23 - Upload interno de media (admin)

Implementado en este lote:
1. Upload real de video interno desde admin:
   - endpoint nuevo: `POST /api/admin/media/upload-link`
   - guarda archivos en `web/public/media/uploads/YYYY/MM/`
   - genera nombre seguro con `uuid` y valida extension/tipo/tamano
   - crea y vincula `Media` automaticamente con ruta interna `/media/...`
2. UI admin conectada al upload:
   - `web/src/components/admin/AdminMediaManager.tsx`
   - formulario `multipart/form-data` con selector de archivo
3. Validaciones nuevas:
   - `validateMediaUploadLinkInput` en `web/src/server/validation/admin.ts`
4. Hardening de catalogo:
   - `web/src/server/db/catalog.ts` tolera `CitationLink` huerfanos
   - logging estructurado `catalog.citation_link_dangling` para monitoreo
5. Pruebas nuevas:
   - `web/tests/integration/admin-media-upload.integration.test.ts`
   - cobertura: upload exitoso, formato invalido y bloqueo por rol

Validacion tecnica posterior:
1. `npm run lint` -> OK
2. `npx tsc --noEmit` -> OK
3. `npm run build` -> OK
4. `npm run test:integration` -> OK (76/76)
5. `npm run test:smoke` -> OK (46/46)

## 13) Actualizacion 2026-02-23 - Hardening de produccion + DB

Implementado en este lote:
1. Seguridad/CSP:
   - CSP endurecida para politica de media interna sin `frame-src` externo.
   - archivo: `web/next.config.ts`.
2. Readiness/health:
   - `/api/health` ahora reporta `database` y `redis`.
   - archivo: `web/src/app/api/health/route.ts`.
3. Media lifecycle productivo:
   - upload admin usa adapter de storage (`local` + fallback cloud preparado).
   - unlink elimina media huérfana (registro DB y cleanup de archivo local).
   - archivos:
     - `web/src/app/api/admin/media/upload-link/route.ts`
     - `web/src/server/media/storage.ts`
     - `web/src/server/db/admin-media.ts`
     - `web/src/app/api/admin/media/unlink/route.ts`
4. Integridad DB:
   - migracion `20260223193000_harden_media_step_certificate_checks` con checks nuevos.
   - scripts de auditoria/reparacion:
     - `web/scripts/db/audit-integrity.ts`
     - `web/scripts/db/repair-integrity.ts`
5. Operacion/CI:
   - pipeline de CI en `.github/workflows/ci.yml` (lint/tsc/build/integration/smoke + Postgres/Redis).
   - `web/.env.example` ampliado con variables requeridas.
6. Documentacion de produccion y DB:
   - `docs/PRODUCTION_GO_LIVE_CHECKLIST.md`
   - `docs/PRODUCTION_READINESS_REPORT_2026-02-23.md`
   - `docs/PRODUCTION_RUNBOOK.md`
   - `docs/DATABASE_ARCHITECTURE.md`
   - ADR: `docs/ADR/0008-production-readiness-and-db-integrity.md`
7. Validacion tecnica final de lote:
   - `npm run lint` -> OK
   - `npx tsc --noEmit` -> OK
   - `npm run build` -> OK
   - `npm run test:integration` -> OK (78/78)
   - `npm run test:smoke` -> OK (46/46)
   - `npm audit --omit=dev` -> OK

## 14) Actualizacion 2026-02-23 - Cierre P0 externo + cloud media + observabilidad central + imagenes

Implementado en este lote:
1. P0 externo operativo:
   - check de secret manager:
     - `web/scripts/ops/secret-manager-check.ts`
     - reporte: `docs/PRODUCTION_SECRET_MANAGER_CHECK_2026-02-23.md`
   - backup/restore drill reproducible:
     - `web/scripts/ops/backup-restore-drill.ts`
     - reporte: `docs/PRODUCTION_BACKUP_RESTORE_DRILL_2026-02-23.md`
2. Adapter cloud de media (S3/R2):
   - `web/src/server/media/storage.ts`
   - soporte `PutObject/DeleteObject` + fallback local configurable.
   - rewrite opcional de `/media/uploads/*` hacia cloud:
     - `web/next.config.ts`
3. Observabilidad central y alertas:
   - logger con forwarding HTTP + alert webhook + cooldown:
     - `web/src/server/observability/logger.ts`
   - test de integracion:
     - `web/tests/integration/logger-observability.integration.test.ts`
4. Rate limit admin sensible:
   - `web/src/app/api/admin/_shared.ts`
   - test:
     - `web/tests/integration/access-control.integration.test.ts`
5. Imagenes relacionadas (desde referencia Stitch, almacenadas localmente):
   - assets en `web/public/media/images/stitch/*`
   - mapeo de imagenes por estilo/move:
     - `web/src/lib/content-images.ts`
   - UI conectada:
     - `web/src/app/page.tsx`
     - `web/src/app/styles/page.tsx`
     - `web/src/app/styles/[slug]/page.tsx`
     - `web/src/app/moves/page.tsx`
     - `web/src/app/moves/[slug]/page.tsx`
   - catalogo extiende `imageUrl/coverImageUrl`:
     - `web/src/server/db/catalog.ts`
     - `web/src/mocks/types.ts`
