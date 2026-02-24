# PHASE 1B Bootstrap (DB + Prisma + Seed)

Fecha: 2026-02-22
Estado: Fase 1B cerrada en entorno local (migraciones + seed + admin CRUD minimo con guardrails y permisos por rol para Style/Substyle/Move).

## Alcance completado

Historias objetivo:
- E2-S1 - Prisma schema v1 (core)
- E2-S2 - Migracion inicial Postgres
- E2-S3 - Seed MVP inicial
- E2-S4 - Admin CRUD minimo (Style/Substyle/Move) con borrado logico
- E2-S5 - Guardrails editoriales (citations + placeholders) para publicacion
- Inicio de reemplazo incremental de mocks por DB en rutas core

## Cambios principales

1. Infraestructura Prisma
- `web/prisma/schema.prisma` (modelo v1 completo con entidades core + relaciones + enums)
- `web/prisma/migrations/2026022201_init/migration.sql` (migracion inicial)
- `web/prisma/migrations/20260222045224_add_archived_flags/migration.sql` (borrado logico en `Style/Substyle/Move`)
- `web/prisma/migrations/migration_lock.toml`
- `web/prisma/seed.ts` (seed idempotente)

2. Scripts de base de datos
- `web/package.json`:
  - `db:generate`
  - `db:migrate`
  - `db:migrate:deploy`
  - `db:push`
  - `db:seed`
  - `db:studio`
  - `db:reset`

3. Configuracion local
- `docker-compose.yml` (PostgreSQL local recomendado)
- `web/.env.example` (`DATABASE_URL`)

4. Capa de acceso a datos
- `web/src/lib/db.ts` (PrismaClient singleton)
- `web/src/server/db/catalog.ts` (repositorios DB-first, filtrando contenido archivado)
- `web/src/server/admin/permissions.ts` (matriz de permisos por rol)
- `web/src/server/db/admin-moves.ts`
- `web/src/server/db/admin-taxonomy.ts`

5. Rutas core conectadas a DB
- `web/src/app/page.tsx`
- `web/src/app/styles/page.tsx`
- `web/src/app/styles/[slug]/page.tsx`
- `web/src/app/substyles/[slug]/page.tsx`
- `web/src/app/moves/page.tsx`
- `web/src/app/moves/[slug]/page.tsx`
- `web/src/app/learn/page.tsx`
- `web/src/app/learn/[courseSlug]/page.tsx`
- `web/src/app/me/page.tsx`
- `web/src/app/me/certificates/page.tsx`

6. Admin CRUD + guardrails en UI/API
- `web/src/app/admin/page.tsx`
- `web/src/app/admin/review/page.tsx`
- `web/src/app/admin/styles/page.tsx`
- `web/src/app/admin/styles/[slug]/page.tsx`
- `web/src/app/admin/substyles/page.tsx`
- `web/src/app/admin/substyles/[slug]/page.tsx`
- `web/src/app/api/admin/_shared.ts`
- `web/src/app/api/admin/moves/*`
- `web/src/app/api/admin/styles/*`
- `web/src/app/api/admin/substyles/*`

7. Pruebas de integracion DB
- `web/tests/integration/catalog.integration.test.ts`
- `web/tests/integration/admin-moves.integration.test.ts`
- `web/tests/integration/admin-taxonomy.integration.test.ts`
- Script: `npm run test:integration`
- Verificacion visual automatizada (design/runtime):
  - `web/tests/design-audit.spec.ts`
  - Se ejecuta dentro de `npm run test:smoke`

## Guardrails y permisos implementados

- `PLACEHOLDER` bloquea transicion a `ready/published`.
- Claims historico-culturales sin citation bloquean `published` en `Style/Substyle`.
- En `Move`, media con `rightsStatus=unknown` bloquea `published`.
- Roles activos:
  - `ADMIN`: CRUD completo + publish + archive
  - `EDITOR`: create/edit + estados hasta `ready`
  - `REVIEWER`: review operacional + citation + estados `review/ready`

## Seed cargado (diseno)

- Styles MVP + Dancehall.
- Substyles House/Popping + 3 substyles `PLACEHOLDER` de Dancehall.
- Moves actuales de UI + 8 moves base Dancehall.
- Lessons/Courses con orden (`CourseLesson.orderIndex`) y estado de gate (`done/active/locked`).
- User de ejemplo + progreso + certificado MVP.
- Concepts, nodes, connection, media y citation base.

## Validaciones ejecutadas

- `cd web && npm run lint` -> OK
- `cd web && npm run build` -> OK
- `cd web && npm run test:smoke` -> OK (41/41)
- `cd web && npm run test:integration` -> OK (15/15)
- `cd web && npx tsc --noEmit` -> OK
- `cd web && npm run db:migrate -- --name add-archived-flags` -> OK
- `cd web && npm run db:seed` -> OK

## Pasos para ejecutar 1B localmente (tu maquina)

1. Levantar Postgres:
```bash
docker compose up -d
```

2. Configurar variables:
```bash
cd web
copy .env.example .env
```

3. Generar cliente, migrar y sembrar:
```bash
npm run db:generate
npm run db:migrate
npm run db:seed
```

4. Validar stack:
```bash
npm run lint
npm run build
npm run test:smoke
npm run test:integration
```

## Resultado de cierre 1B

- Admin minimo con CRUD + borrado logico + transiciones editoriales para `Style/Substyle/Move`.
- Guardrails editoriales operativos con mensajes de validacion claros.
- Permisos por rol activos en rutas/endpoints admin.
- Suite tecnica en verde para continuar al siguiente bloque.
