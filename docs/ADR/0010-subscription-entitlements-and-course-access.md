# ADR 0010 - Subscription Entitlements and Course Access Gating

- Fecha: 2026-02-24
- Estado: Aceptado
- Contexto: la plataforma tenia pricing visual, pero sin flujo transaccional real ni modelo persistente de plan. Como resultado, no era posible aplicar restricciones por tipo de usuario (free, style-pack, pro, studio) ni mantener consistencia de navegacion.

## Decision

1. Se agrega modelo persistente de suscripcion por usuario:
   - `SubscriptionPlan`: `FREE`, `STYLE_PACK`, `PRO`, `STUDIO`.
   - `SubscriptionStatus`: `active`, `canceled`.
   - `UserSubscription` con relacion unica por usuario y estilo opcional para `STYLE_PACK`.
2. Se define capa de autorizacion por plan:
   - `getUserEntitlement` + `evaluateCourseAccess` en `web/src/server/db/subscriptions.ts`.
   - Reglas:
     - visitante: sin acceso al player de curso.
     - free: sin acceso a cursos premium.
     - style-pack: acceso solo al estilo contratado.
     - pro/studio: acceso total a cursos.
     - roles internos (`ADMIN/EDITOR/REVIEWER`) con bypass operativo.
3. Se implementa flujo transaccional MVP de compra/activacion:
   - `GET /checkout` (si no hay sesion, redirige a login con `next`).
   - `POST /api/billing/subscribe` para activar/cambiar plan.
   - pricing CTAs para planes pagos direccionan a login->checkout cuando aplica.
4. Se endurece consistencia de auth/navigation:
   - `register` preserva `next` (`redirectTo`) y crea suscripcion `FREE` al alta.
   - `/learn/[courseSlug]` exige sesion y plan compatible antes de renderizar.
   - APIs de progreso validan entitlement antes de mutar estado.

## Consecuencias

Positivas:
- Se elimina brecha entre pricing y permisos reales.
- Se soportan los 4 tipos de usuario solicitados con logica verificable.
- Se reduce navegacion incoherente (curso premium abierto sin plan).

Costos:
- Aumenta complejidad de flujos de auth/progreso.
- Requiere migracion DB y seed actualizado.
- Introduce ruta de checkout MVP (sin pasarela de pago externa aun).

## Implementacion relacionada

- `web/prisma/schema.prisma`
- `web/prisma/migrations/20260224004000_add_user_subscriptions/migration.sql`
- `web/src/server/db/subscriptions.ts`
- `web/src/app/checkout/page.tsx`
- `web/src/app/api/billing/subscribe/route.ts`
- `web/src/app/pricing/page.tsx`
- `web/src/app/learn/[courseSlug]/page.tsx`
- `web/src/app/api/progress/lessons/complete/route.ts`
- `web/src/app/api/progress/lessons/steps/toggle/route.ts`
- `web/tests/plan-access.spec.ts`

