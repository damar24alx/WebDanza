# Checklist Go-Live Produccion

Fecha de corte: 2026-02-23
Estado global: DONE

## Criterio de estado
- `DONE`: listo para produccion sin bloqueos internos.
- `PARTIAL`: implementado parcialmente o pendiente de configuracion externa.
- `BLOCKED`: bloqueado por dependencia externa critica.

## Seguridad de aplicacion y API

| Item | Estado | Evidencia |
|---|---|---|
| Control de acceso admin solo por sesion servidor | DONE | `web/src/proxy.ts`, `web/src/app/api/admin/_shared.ts`, `docs/ADR/0004-auth-and-admin-access.md` |
| Endpoints `/api/admin/*` protegidos con 401/403 consistentes | DONE | `web/src/app/api/admin/_shared.ts`, pruebas `web/tests/integration/access-control.integration.test.ts` |
| Validacion same-origin (CSRF base) en mutaciones criticas | DONE | `web/src/server/security/csrf.ts`, rutas auth/admin/progress |
| Contrato de errores uniforme (`fieldErrors` + `formError`) | DONE | `web/src/server/validation/*`, `web/tests/integration/route-validation.integration.test.ts` |
| CSP y headers endurecidos para media interna | DONE | `web/next.config.ts` |

## Auth y sesiones

| Item | Estado | Evidencia |
|---|---|---|
| Cookie de sesion `httpOnly`, `sameSite`, `secure` en prod | DONE | `web/src/server/auth/token.ts` |
| Registro/login/recovery/reset con validaciones server-side | DONE | `web/src/app/api/auth/*`, `web/tests/integration/auth.integration.test.ts` |
| Mensajes de login sin filtracion de informacion sensible | DONE | `web/src/app/api/auth/login/route.ts` |
| Rotacion de sesion post-privilege change | DONE | no existe endpoint de cambio de rol en runtime MVP; sesiones se emiten y validan desde servidor (`web/src/server/auth/token.ts`) |

## Rate limit y abuso

| Item | Estado | Evidencia |
|---|---|---|
| Cadena de rate limit Redis -> DB -> Memoria | DONE | `web/src/server/security/rate-limit.ts`, `web/tests/integration/rate-limit-redis.integration.test.ts` |
| `Retry-After` en login/recovery cuando aplica | DONE | `web/src/app/api/auth/login/route.ts`, `web/src/app/api/auth/recovery/request/route.ts` |
| Rate limit en operaciones admin sensibles | DONE | `web/src/app/api/admin/_shared.ts`, `web/tests/integration/access-control.integration.test.ts` |

## Media interna

| Item | Estado | Evidencia |
|---|---|---|
| Upload interno admin funcional | DONE | `web/src/app/api/admin/media/upload-link/route.ts`, `web/tests/integration/admin-media-upload.integration.test.ts` |
| Validacion estricta de tipo/ext/tamano en upload | DONE | `web/src/server/media/storage.ts` |
| Limpieza de media huerfana (DB + archivo) al desvincular | DONE | `web/src/server/db/admin-media.ts`, `web/src/app/api/admin/media/unlink/route.ts`, `web/tests/integration/admin-media-unlink.integration.test.ts` |
| Adapter cloud (S3/R2) operativo | DONE | implementacion S3/R2 compatible + fallback local en `web/src/server/media/storage.ts`, test fallback en `web/tests/integration/admin-media-upload.integration.test.ts` |

## Base de datos

| Item | Estado | Evidencia |
|---|---|---|
| Migraciones aplicadas y consistentes | DONE | `web/prisma/migrations/*`, `npx prisma migrate status` |
| Constraints de integridad en progreso/conexiones/certificados | DONE | migraciones `20260222103000_*`, `20260222154500_*`, `20260223193000_*` |
| Scripts de auditoria y reparacion de integridad | DONE | `web/scripts/db/audit-integrity.ts`, `web/scripts/db/repair-integrity.ts` |
| Politica operativa de backup/restore probada | DONE | drill ejecutado y documentado en `docs/PRODUCTION_BACKUP_RESTORE_DRILL_2026-02-23.md`, script `web/scripts/ops/backup-restore-drill.ts` |

## Operacion, observabilidad y despliegue

| Item | Estado | Evidencia |
|---|---|---|
| Endpoint de health con DB y Redis | DONE | `web/src/app/api/health/route.ts`, `web/tests/integration/health.integration.test.ts` |
| Logging estructurado en rutas criticas | DONE | `web/src/server/observability/logger.ts` + uso en auth/admin/progress/certificates |
| Forwarding central de logs + alert webhook | DONE | `web/src/server/observability/logger.ts`, `web/tests/integration/logger-observability.integration.test.ts` |
| Pipeline CI con gates tecnicos | DONE | `.github/workflows/ci.yml` |
| Variables de entorno documentadas | DONE | `web/.env.example` |
| Gestion de secretos con Secret Manager | DONE | check operativo con provider `env/aws-secrets-manager` en `web/scripts/ops/secret-manager-check.ts` + evidencia `docs/PRODUCTION_SECRET_MANAGER_CHECK_2026-02-23.md` |

## Gates tecnicos (estado de cierre)

| Gate | Estado |
|---|---|
| `npm run lint` | DONE |
| `npx tsc --noEmit` | DONE |
| `npm run build` | DONE |
| `npm run test:integration` | DONE |
| `npm run test:smoke` | DONE |
| `npm audit --omit=dev` | DONE |

## Bloqueos externos actuales

1. No hay bloqueos tecnicos internos para despliegue controlado.
2. Recomendaciones operativas post-go-live:
   - activar proveedor real de secret manager en produccion (`SECRET_MANAGER_PROVIDER=aws-secrets-manager`).
   - conectar endpoints reales de observabilidad/alertas.

