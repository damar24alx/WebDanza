# ADR 0008 - Estrategia de readiness de produccion e integridad DB

Fecha: 2026-02-23
Estado: Accepted

## Contexto

El MVP funcional ya cubre flujos core de catalogo, aprendizaje, progreso y certificados. Para avanzar a despliegue productivo faltaba estandarizar operacion y endurecer integridad de datos en puntos no cubiertos por FKs polimorficas (`MediaLink`/`CitationLink`) y reglas de consistencia adicional.

## Decision

1. Definir checklist formal de go-live con estado trazable por item (`DONE/PARTIAL/BLOCKED`).
2. Incorporar runbook operativo con arranque, migraciones, health checks y rollback basico.
3. Endurecer DB con checks adicionales:
   - `UserLessonStepProgress.stepIndex >= 0`
   - `Media.durationSec >= 0` o `NULL`
   - consistencia `Certificate.status` vs `revokedAt`
4. Agregar scripts operativos de integridad:
   - `audit-integrity` (inspeccion)
   - `repair-integrity` (dry-run por defecto, apply explicito)
5. Automatizar gates tecnicos en CI con servicios de Postgres y Redis.

## Consecuencias

Positivas:
1. Mayor seguridad operativa para despliegue continuo.
2. Reduccion de riesgo de corrupcion silenciosa en enlaces polimorficos.
3. Trazabilidad clara de estado de produccion para handoff.

Tradeoffs:
1. Se incrementa costo de mantenimiento documental (checklist/reportes).
2. Los scripts de repair requieren criterio operacional para ejecucion en `--apply`.
3. Parte del go-live sigue dependiendo de infraestructura externa (secret manager, observabilidad central, backup/restore real).

## Implementacion asociada

1. Migracion:
   - `web/prisma/migrations/20260223193000_harden_media_step_certificate_checks/migration.sql`
2. Scripts:
   - `web/scripts/db/integrity-core.ts`
   - `web/scripts/db/audit-integrity.ts`
   - `web/scripts/db/repair-integrity.ts`
3. CI:
   - `.github/workflows/ci.yml`
4. Documentacion:
   - `docs/PRODUCTION_GO_LIVE_CHECKLIST.md`
   - `docs/PRODUCTION_READINESS_REPORT_2026-02-23.md`
   - `docs/PRODUCTION_RUNBOOK.md`
   - `docs/DATABASE_ARCHITECTURE.md`
