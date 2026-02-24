# Runbook Operativo - Produccion

Fecha: 2026-02-23
Aplicacion: `web/`

## 1) Prerrequisitos

1. Node.js 20+
2. PostgreSQL accesible
3. Redis accesible (recomendado para rate-limit distribuido)
4. Variables de entorno configuradas (ver `web/.env.example`)

## 2) Arranque local/servidor

Desde `web/`:

```bash
npm ci
npx prisma migrate deploy
npm run db:seed    # opcional en entorno no-productivo
npm run build
npm run start
```

## 3) Health checks

1. Endpoint: `GET /api/health`
2. Esperado:
   - `status=ok`
   - `services.database=ok`
   - `services.redis=ok` o estado segun modo de fallback

## 4) Pipeline de calidad minimo

```bash
npm run lint
npx tsc --noEmit
npm run build
npm run test:integration
npm run test:smoke
npm audit --omit=dev
```

## 5) Migraciones

### Aplicar migraciones

```bash
npx prisma migrate deploy
```

### Ver estado

```bash
npx prisma migrate status
```

## 6) Integridad de datos

### Auditoria

```bash
npm run db:audit-integrity
```

### Reparacion segura

```bash
npm run db:repair-integrity        # dry-run
npm run db:repair-integrity -- --apply
```

## 6.1) Secret manager check

```bash
npm run ops:secret-manager-check
```

Notas:
1. Local/dev usa `SECRET_MANAGER_PROVIDER=env`.
2. Produccion puede usar `SECRET_MANAGER_PROVIDER=aws-secrets-manager`.

## 6.2) Backup/restore drill

```bash
npm run ops:backup-restore-drill
```

El reporte se guarda en:
- `docs/PRODUCTION_BACKUP_RESTORE_DRILL_YYYY-MM-DD.md`

## 7) Rollback basico

No usar `git reset --hard` en produccion.

Estrategia recomendada:
1. Deploy blue/green o canary.
2. Si hay regresion:
   - revertir release al artefacto anterior.
   - restaurar DB solo si hubo migracion destructiva (evitar en MVP).
3. Mantener respaldo previo a cada ventana de migracion.

## 8) Operacion de media interna

1. Upload admin:
   - endpoint `POST /api/admin/media/upload-link`
2. Storage:
   - local: `web/public/media/uploads/...`
3. Limpieza:
   - al desvincular ultima referencia se limpia registro y archivo local.
4. Cloud:
   - adapter S3/R2 operativo con fallback local configurable.
   - para endurecer produccion usar `MEDIA_CLOUD_ALLOW_LOCAL_FALLBACK=false`.
   - para servir assets cloud por ruta interna usar `MEDIA_CLOUD_PUBLIC_BASE_URL`.

## 9) Seguridad operativa

1. `AUTH_SECRET` largo y aleatorio.
2. Cookies de sesion seguras en produccion.
3. Rate limit activo en login/recovery.
4. CSP y headers de seguridad activos.
5. Rotacion de secretos y revision de permisos por rol.

## 10) Alertas recomendadas

1. `GET /api/health` en estado degradado.
2. tasa de errores 5xx por ruta critica (`/api/auth/*`, `/api/admin/*`, `/api/progress/*`).
3. incremento abrupto de intentos de login fallido.
4. crecimiento anomalo de `RateLimitEntry`.
5. fallas de forwarding en logger:
   - `observability.forward.failed`
   - `observability.alert.failed`

## 11) Incidentes comunes y respuesta

1. DB no disponible:
   - validar `DATABASE_URL`
   - revisar conectividad/red
   - ejecutar health y logs
2. Redis caido:
   - si `RATE_LIMIT_STORE=auto`, sistema usa fallback DB/memoria
   - restaurar Redis para throughput optimo
3. Error de media upload:
   - validar tamano/tipo de archivo
   - revisar permisos de escritura en `public/media/uploads`
4. Errores de migracion:
   - inspeccionar `_prisma_migrations`
   - no forzar cambios manuales sin respaldo

