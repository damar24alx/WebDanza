# Sprint 1 Plan - E3 Media interna + Citation Foundations

Duracion sugerida: 2 semanas
Objetivo principal: cerrar E3-S3 (media interna) y avanzar E3-S4 con entregables productivos.

## Historias objetivo

- E3-S3 (Must) - Integracion Media interna
- E3-S4 (Must) - Gestion de Citation y Source (primer tramo extendido)

## Resultado esperado del sprint

1. Admin permite crear/vincular media a entidades core con validaciones.
2. Detail pages muestran media con fallback por rightsStatus.
3. Citation link se extiende al menos a lesson/course ademas de move/style/substyle.
4. Integracion y smoke cubren nuevos flujos.

## Scope tecnico detallado

### Slice PR-1: Backend Media Links
- Objetivo: CRUD basico de media links y validacion de ruta interna.
- Archivos esperados:
  - `web/src/server/db/admin-media.ts` (nuevo)
  - `web/src/app/api/admin/media/*` (nuevos endpoints)
- Reglas:
  - provider permitido: `other` (media interna)
  - `rightsStatus` obligatorio
  - ruta valida requerida bajo `/media/...`

### Slice PR-2: UI Admin Media
- Objetivo: panel admin para vincular media por entidad.
- Archivos esperados:
  - rutas admin existentes (`/admin/review`, `/admin/styles/[slug]`, `/admin/substyles/[slug]`)
  - opcional ruta dedicada: `/admin/media`
- Reglas:
  - feedback claro de validacion/errores
  - respeta permisos por rol

### Slice PR-3: Render Media en Detail Pages
- Objetivo: mostrar media en Move/Lesson/Course con fallback.
- Archivos esperados:
  - `web/src/app/moves/[slug]/page.tsx`
  - `web/src/app/learn/[courseSlug]/page.tsx`
  - `web/src/server/db/catalog.ts` (consultas media links)
- Reglas:
  - si `blocked/restricted`, mostrar mensaje contextual
  - nunca romper layout por embed

### Slice PR-4: Citation Extension (lesson/course)
- Objetivo: extender citations a lesson/course.
- Archivos esperados:
  - `web/src/server/db/admin-taxonomy.ts` o modulo citation dedicado
  - `web/src/app/api/admin/citations/*`
  - detail pages de lesson/course con lista de sources

### Slice PR-5: Testing + Docs
- Objetivo: evidencia de cierre.
- Archivos esperados:
  - `web/tests/integration/*` nuevos casos
  - `web/tests/design-audit.spec.ts` (si aplica)
  - `docs/MVP_STATUS_MATRIX.md` actualizado
  - `docs/HANDOFF_STATUS_v3.md` actualizado

## Definition of Done del sprint

- E3-S3 en DONE
- E3-S4 en estado >= 70% (o DONE si cabe en tiempo)
- Gating tecnico en verde:
  - `npm run lint`
  - `npx tsc --noEmit`
  - `npm run build`
  - `npm run test:integration`
  - `npm run test:smoke`

## Ritual diario sugerido (30-45 min plan + ejecucion)

1. Seleccionar 1 slice y definir AC del dia.
2. Pedir al agente IA implementacion exacta del slice.
3. Ejecutar gates tecnicos.
4. Corregir regresiones y actualizar docs.

## Prompts listos para agente IA (copiar/pegar)

### Prompt A - PR-1 backend media
"Implementa E3-S3 slice backend media links en este repo. Necesito modulo server para create/link/list media por entidad (move, lesson, course, style, substyle) con validacion de provider/url/rightsStatus y endpoints POST en /api/admin/media/*. Usa Prisma y respeta permisos por rol ya existentes. Incluye tests de integracion. Ejecuta lint, tsc, build e integration al final y reporta resultado."

### Prompt B - PR-2 UI admin media
"Conecta UI admin para gestionar media links por entidad. Agrega formularios y mensajes de validacion en admin/review y detail admin de styles/substyles, sin romper layout existente. El rol debe venir solo de sesion del servidor. Ejecuta smoke + design audit al final."

### Prompt C - PR-3 render media en contenido
"Integra media en paginas de detalle (moves y learn/course) con fallback por rightsStatus. Si blocked/restricted, mostrar estado claro sin embed. Mantener responsive desktop/mobile. Agrega pruebas donde aplique y valida build."

### Prompt D - PR-4 citations extendidas
"Extiende flujo citation para lesson/course con links y visualizacion de sources en detalle. Debe cumplir guardrails editoriales para claims historicos cuando aplique. Incluye integration tests y actualiza docs de estado."

## Checklist de cierre Sprint 1

- [x] E3-S3 cerrado
- [x] E3-S4 avanzado/cerrado (lesson/course)
- [x] Sin regresiones en rutas core
- [x] Documentacion actualizada
- [x] Estado reflejado en `docs/MVP_STATUS_MATRIX.md`

## Progreso actual (2026-02-22)

- [x] PR-1 backend media completado:
  - `web/src/server/db/admin-media.ts`
  - `web/src/app/api/admin/media/create/route.ts`
  - `web/src/app/api/admin/media/link/route.ts`
  - `web/src/app/api/admin/media/create-link/route.ts`
  - `web/src/app/api/admin/media/unlink/route.ts`
  - `web/tests/integration/admin-media.integration.test.ts`
- [x] Validaciones ejecutadas:
  - `npm run lint`
  - `npx tsc --noEmit`
  - `npm run build`
  - `npm run test:integration` (31/31)
  - `npm run test:smoke` (43/43)
- [x] PR-2 UI admin media completado:
  - `web/src/components/admin/AdminMediaManager.tsx`
  - `web/src/app/admin/review/page.tsx`
  - `web/src/app/admin/styles/[slug]/page.tsx`
  - `web/src/app/admin/substyles/[slug]/page.tsx`
- [x] PR-3 render/fallback media completado:
  - `web/src/components/media/ContentMediaPanel.tsx`
  - `web/src/app/moves/[slug]/page.tsx`
  - `web/src/app/learn/[courseSlug]/page.tsx`
  - `web/src/server/db/catalog.ts`
- [x] PR-4 extension citation lesson/course completado:
  - `web/src/server/db/admin-citations.ts`
  - `web/src/app/api/admin/citations/link/route.ts`
  - `web/src/app/learn/[courseSlug]/page.tsx` (sources render)
  - `web/tests/integration/admin-citations.integration.test.ts`

## Extension hardening (2026-02-22 noche)

- [x] P0 anti-leak: catalogo publico no expone progreso de otros usuarios.
  - `web/src/server/db/catalog.ts`
  - `web/tests/integration/catalog.integration.test.ts`
- [x] Auth real + validaciones:
  - `web/src/app/api/auth/register/route.ts`
  - `web/src/app/api/auth/recovery/request/route.ts`
  - `web/src/app/api/auth/login/route.ts`
  - `web/src/app/auth/login/page.tsx`
  - `web/src/app/auth/register/page.tsx`
  - `web/src/app/auth/recovery/page.tsx`
  - `web/src/server/validation/auth.ts`
  - `web/src/server/validation/utils.ts`
- [x] Hardening de seguridad:
  - CSRF same-origin base:
    - `web/src/server/security/csrf.ts`
    - `web/src/app/api/admin/_shared.ts`
    - `web/src/app/api/auth/*`
    - `web/src/app/api/progress/lessons/complete/route.ts`
  - Rate limit login:
    - `web/src/server/security/rate-limit.ts`
    - `web/src/app/api/auth/login/route.ts`
  - Security headers:
    - `web/next.config.ts`
- [x] Integridad de datos:
  - `web/prisma/migrations/20260222154500_harden_user_progress_uniques_and_connection_strength/migration.sql`
  - `web/prisma/schema.prisma`
  - `web/src/server/db/progress.ts`
- [x] QA adicional:
  - `web/tests/integration/auth.integration.test.ts` (nuevo)
  - `web/tests/integration/access-control.integration.test.ts` (CSRF cross-origin)
  - `web/tests/integration/admin-citations.integration.test.ts` (URL invalida)
- [x] Gates ejecutados en verde:
  - `npm run lint`
  - `npx tsc --noEmit`
  - `npm run build`
  - `npm run test:integration` (41/41)
  - `npm run test:smoke` (43/43)

## Extension hardening 2 (2026-02-23)

- [x] Reset password completo:
  - `web/prisma/schema.prisma` (`PasswordResetToken`)
  - `web/src/server/auth/password-reset.ts`
  - `web/src/app/api/auth/recovery/request/route.ts`
  - `web/src/app/api/auth/recovery/reset/route.ts`
  - `web/src/app/auth/recovery/reset/page.tsx`
  - `web/tests/integration/auth.integration.test.ts` (token expirado)
- [x] Estandarizacion validaciones admin/progress (JSON 422):
  - `web/src/server/validation/admin.ts`
  - `web/src/server/validation/progress.ts`
  - `web/src/app/api/admin/*` (mutaciones POST)
  - `web/src/app/api/progress/lessons/complete/route.ts`
  - `web/tests/integration/route-validation.integration.test.ts`
- [x] Certificados E2E:
  - `web/src/server/db/progress.ts` (regla `all_lessons` + `percent_90`)
  - `web/src/app/api/certificates/verify/[code]/route.ts`
  - `web/tests/integration/progress.integration.test.ts`
  - `web/tests/integration/certificates.integration.test.ts`
- [x] Gates ejecutados en verde:
  - `npm run lint`
  - `npx tsc --noEmit`
  - `npm run build`
  - `npm run test:integration` (51/51)
  - `npm run test:smoke` (43/43)

## Extension cierre (2026-02-23) - P0 + E4 + E6

- [x] P0 lessons unpublished:
  - filtro public-only `published` en catalogo de cursos.
  - test anti-exposicion agregado.
- [x] E4 completo:
  - checklist por paso persistente (`UserLessonStepProgress`).
  - endpoint `/api/progress/lessons/steps/toggle`.
  - bloqueo real secuencial + reanudacion exacta en `/learn` y `/me`.
  - pruebas de gating/resume agregadas.
- [x] E6 completo:
  - `generateMetadata` por entidad (`styles`, `moves`, `learn/course`).
  - `sitemap.ts` y `robots.ts`.
  - performance budget en `docs/PERFORMANCE_BUDGET.md`.
  - observabilidad minima: `/api/health` + logging estructurado.
- [x] Hardening corto:
  - verify certificado sin IDs internos.
  - CSP endurecida (sin `unsafe-eval` en produccion).
  - rate limit login/recovery con `Retry-After`.
- [x] Gates tecnicos:
  - `npm run lint`
  - `npx tsc --noEmit`
  - `npm run build`
  - `npm run test:integration` (57/57)
  - `npm run test:smoke` (43/43)

## Extension cierre final (2026-02-23) - E1-S4 + E3-S4

- [x] E1-S4 busqueda global MVP:
  - `web/src/server/db/search.ts`
  - `web/src/app/search/page.tsx`
  - `web/src/components/layout/Navbar.tsx`
  - `web/src/components/layout/Footer.tsx`
  - `web/tests/integration/search.integration.test.ts`
- [x] E3-S4 citation completa (incluye `connection`):
  - `web/src/server/db/admin-citations.ts`
  - `web/src/server/validation/admin.ts`
  - `web/src/app/admin/page.tsx`
  - `web/tests/integration/admin-citations.integration.test.ts`
- [x] Gates tecnicos:
  - `npm run lint`
  - `npx tsc --noEmit`
  - `npm run build`
  - `npm run test:integration` (61/61)
  - `npm run test:smoke` (44/44)

## Extension operacional (2026-02-23) - E5-S4 + E6-S5 + hardening

- [x] E5-S4 logros MVP:
  - `web/src/server/db/achievements.ts`
  - `web/src/app/me/page.tsx`
  - `web/src/app/me/achievements/page.tsx`
  - `web/tests/integration/achievements.integration.test.ts`
- [x] E6-S5 KPIs MVP:
  - `web/src/server/db/kpis.ts`
  - `web/src/app/admin/kpis/page.tsx`
  - `web/tests/integration/kpis.integration.test.ts`
- [x] Hardening operacional:
  - Rate limit store compartido:
    - `web/src/server/security/rate-limit.ts`
    - `web/prisma/schema.prisma`
    - `web/prisma/migrations/20260223101500_add_rate_limit_entries/migration.sql`
  - Observabilidad cliente (web vitals):
    - `web/src/components/observability/WebVitalsReporter.tsx`
    - `web/src/app/api/observability/web-vitals/route.ts`
    - `web/tests/integration/web-vitals.integration.test.ts`
- [x] Gates tecnicos:
  - `npm run lint`
  - `npx tsc --noEmit`
  - `npm run build`
  - `npm run test:integration` (68/68)
  - `npm run test:smoke` (45/45)

## Extension cierre (2026-02-23) - E4-S5 + E5-S5 + Redis

- [x] E4-S5 tablero de progreso por estilo:
  - `web/src/server/db/profile.ts`
  - `web/src/app/me/page.tsx`
  - `web/tests/integration/profile-style-progress.integration.test.ts`
- [x] E5-S5 reemision/revocacion admin certificados:
  - `web/prisma/schema.prisma`
  - `web/prisma/migrations/20260223112000_add_certificate_status_and_events/migration.sql`
  - `web/src/server/db/admin-certificates.ts`
  - `web/src/app/admin/certificates/page.tsx`
  - `web/tests/integration/admin-certificates.integration.test.ts`
- [x] Rate-limit Redis distribuido con fallback:
  - `web/src/server/security/rate-limit.ts`
  - `web/tests/integration/rate-limit-redis.integration.test.ts`
  - dependencia `redis` en `web/package.json`
- [x] Estabilizacion smoke/design audit:
  - `web/playwright.config.ts` (`build + start` + `AUTH_SECRET` de pruebas)
  - `web/tests/smoke.spec.ts`
  - `web/tests/design-audit.spec.ts`
- [x] Gates tecnicos:
  - `npm run lint`
  - `npx tsc --noEmit`
  - `npm run build`
  - `npm run test:integration` (73/73)
  - `npm run test:smoke` (46/46)

## Extension go-live (2026-02-23) - Hardening de produccion y base de datos

- [x] CI de produccion:
  - `.github/workflows/ci.yml` con Postgres + Redis + gates (`lint/tsc/build/integration/smoke`).
- [x] Variables de entorno completas:
  - `web/.env.example` ampliado para auth, rate-limit y media storage.
- [x] Hardening de media lifecycle:
  - upload admin via adapter (`web/src/server/media/storage.ts`).
  - cleanup de media huérfana al unlink.
  - prueba: `web/tests/integration/admin-media-unlink.integration.test.ts`.
- [x] Hardening DB:
  - migracion `20260223193000_harden_media_step_certificate_checks`.
  - scripts:
    - `npm run db:audit-integrity`
    - `npm run db:repair-integrity`
- [x] Documentacion operativa:
  - `docs/PRODUCTION_GO_LIVE_CHECKLIST.md`
  - `docs/PRODUCTION_READINESS_REPORT_2026-02-23.md`
  - `docs/PRODUCTION_RUNBOOK.md`
  - `docs/DATABASE_ARCHITECTURE.md`

## Extension cierre final (2026-02-23) - P0 externo + cloud media + observabilidad central

- [x] Secret manager check operativo:
  - `web/scripts/ops/secret-manager-check.ts`
  - `docs/PRODUCTION_SECRET_MANAGER_CHECK_2026-02-23.md`
- [x] Backup/restore drill ejecutable con evidencia:
  - `web/scripts/ops/backup-restore-drill.ts`
  - `docs/PRODUCTION_BACKUP_RESTORE_DRILL_2026-02-23.md`
- [x] Adapter cloud de media implementado:
  - `web/src/server/media/storage.ts`
  - fallback cloud->local probado en `web/tests/integration/admin-media-upload.integration.test.ts`
- [x] Observabilidad central + alertas:
  - `web/src/server/observability/logger.ts`
  - `web/tests/integration/logger-observability.integration.test.ts`
- [x] Rate limit admin sensible:
  - `web/src/app/api/admin/_shared.ts`
  - `web/tests/integration/access-control.integration.test.ts`
- [x] Relleno visual con imagenes relacionadas (referencia Stitch):
  - assets locales: `web/public/media/images/stitch/*`
  - paginas: `/`, `/styles`, `/styles/[slug]`, `/moves`, `/moves/[slug]`
