# ADR 0009 - Secret manager operativo, media cloud y observabilidad central

Fecha: 2026-02-23
Estado: Accepted

## Contexto

Para cerrar readiness de produccion faltaban tres capacidades operativas:
1. verificacion reproducible de secretos criticos;
2. soporte real de storage cloud para media interna;
3. envio centralizado de logs y alertas.

## Decision

1. Secret manager:
   - se implementa script operacional `ops:secret-manager-check` con provider `env` y `aws-secrets-manager`.
2. Backup/restore drill:
   - se implementa script `ops:backup-restore-drill` con modos:
     - `local` (`pg_dump/pg_restore`)
     - `docker` (`docker exec`)
     - `sql-clone` fallback (`CREATE DATABASE ... TEMPLATE ...`).
3. Media cloud:
   - `web/src/server/media/storage.ts` soporta `PutObject/DeleteObject` S3/R2 compatible.
   - se mantiene fallback local configurable (`MEDIA_CLOUD_ALLOW_LOCAL_FALLBACK`).
4. Observabilidad:
   - `logEvent` mantiene salida estructurada local y agrega:
     - forwarding HTTP a endpoint central
     - webhook de alertas con cooldown.
5. Admin hardening:
   - rate limit para mutaciones admin en `requireAdminApiAccess`.

## Consecuencias

Positivas:
1. readiness operativo auditable con scripts y reportes.
2. despliegue cloud de media sin depender solo de disco local.
3. trazabilidad y alertamiento central desde backend sin tooling extra.

Tradeoffs:
1. aumenta superficie de configuracion por variables de entorno.
2. fallback local en media cloud debe endurecerse en produccion estable.
3. provider real externo (AWS endpoints/secrets) requiere credenciales fuera del repo.

## Implementacion asociada

1. Scripts:
   - `web/scripts/ops/secret-manager-check.ts`
   - `web/scripts/ops/backup-restore-drill.ts`
2. Media:
   - `web/src/server/media/storage.ts`
   - `web/tests/integration/admin-media-upload.integration.test.ts`
3. Observabilidad:
   - `web/src/server/observability/logger.ts`
   - `web/tests/integration/logger-observability.integration.test.ts`
4. Seguridad admin:
   - `web/src/app/api/admin/_shared.ts`
   - `web/tests/integration/access-control.integration.test.ts`
