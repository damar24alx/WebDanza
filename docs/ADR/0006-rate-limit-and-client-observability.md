# ADR 0006 - Rate Limit compartido y captura de Web Vitals cliente

Fecha: 2026-02-23
Estado: Accepted

## Contexto

Tras cerrar las historias Must del MVP, quedaban dos necesidades operacionales:

1. Evitar que el rate limit dependa solo de memoria local del proceso.
2. Capturar senales de performance reales del cliente para observabilidad basica.

El rate limit en memoria era funcional para una sola instancia, pero no consistente cuando hay multiples instancias o reinicios.

## Decision

1. Rate limit:
   - Se introduce modelo `RateLimitEntry` en Prisma.
   - `web/src/server/security/rate-limit.ts` usa store compartido en DB por defecto.
   - Se mantiene fallback en memoria si el store DB falla temporalmente.
2. Observabilidad cliente:
   - Se agrega componente cliente `WebVitalsReporter` en el layout global.
   - El cliente reporta `TTFB`, `FCP`, `LCP` y `CLS` a `POST /api/observability/web-vitals`.
   - El endpoint valida payload con `zod` y aplica control same-origin.

## Consecuencias

Positivas:
1. Rate limit coherente entre instancias compartiendo la misma base de datos.
2. Menor dependencia de estado en memoria para control de abuso.
3. Primer canal de telemetria de performance real desde navegador.

Tradeoffs:
1. El rate limit ahora realiza operaciones extra en DB (costo de I/O).
2. Para volumen alto, Redis sigue siendo mejor opcion operacional.
3. Web vitals quedan en logs; aun no hay pipeline de agregacion historica dedicado.

## Implementacion asociada

1. Prisma:
   - `web/prisma/schema.prisma` (`RateLimitEntry`)
   - `web/prisma/migrations/20260223101500_add_rate_limit_entries/migration.sql`
2. Backend:
   - `web/src/server/security/rate-limit.ts`
   - `web/src/app/api/observability/web-vitals/route.ts`
   - `web/src/server/validation/observability.ts`
3. Frontend:
   - `web/src/components/observability/WebVitalsReporter.tsx`
   - `web/src/app/layout.tsx`
4. Pruebas:
   - `web/tests/integration/web-vitals.integration.test.ts`
   - `web/tests/integration/auth.integration.test.ts` (estabilizacion de buckets en setup)

