# Web Danza

Aplicacion web del MVP de la plataforma de danza.

Stack:
- Next.js App Router + TypeScript
- Prisma + PostgreSQL
- Redis (opcional recomendado para rate limit distribuido)

## Requisitos

- Node.js 20+
- PostgreSQL accesible
- Redis accesible (opcional)
- Variables de entorno en `.env` (base en `.env.example`)

## Comandos base

```bash
npm ci
npx prisma migrate deploy
npm run db:seed
npm run dev
```

## Build y arranque de produccion

```bash
npm run build
npm run start
```

## Gates de calidad

```bash
npm run lint
npx tsc --noEmit
npm run test:integration
npm run test:smoke
npm run db:audit-integrity
npm audit --omit=dev
npx prisma validate
npx prisma migrate status
```

Atajo para release local:

```bash
npm run quality:release
```

## Operacion

- Runbook: `../docs/PRODUCTION_RUNBOOK.md`
- Checklist go-live: `../docs/PRODUCTION_GO_LIVE_CHECKLIST.md`
- Readiness report: `../docs/PRODUCTION_READINESS_REPORT_2026-02-23.md`
