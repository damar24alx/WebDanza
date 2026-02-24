# ADR 0007 - Politica de media interna exclusiva

Fecha: 2026-02-23
Estado: Accepted
Supersede: ADR 0003

## Contexto

La direccion de producto para el MVP cambia: todo el contenido multimedia debe vivir dentro de la plataforma y no depender de enlaces externos de terceros.

El comportamiento actual permitia URLs externas (YouTube/Vimeo) en creacion, vinculacion y render de media.

## Decision

1. Solo se acepta `provider=other` para media en admin.
2. La URL de media debe ser ruta interna bajo `/media/...`.
3. Se elimina la salida de enlaces externos en UI de contenido y panel admin.
4. El catalogo publico ignora media legacy que no cumpla politica interna (`provider=other` + ruta `/media/...`).

## Consecuencias

Positivas:
1. Eliminamos dependencia de terceros para reproduccion.
2. Mayor control de disponibilidad y derechos en una sola plataforma.
3. Menor riesgo de enlaces rotos o embeds bloqueados por politicas externas.

Tradeoffs:
1. Requiere pipeline de carga/publicacion de archivos internos para operacion real.
2. El contenido legacy externo deja de mostrarse en catalogo publico.
3. Aumenta responsabilidad operativa de almacenamiento y entrega de media.

## Implementacion asociada

1. Validacion:
   - `web/src/server/validation/admin.ts`
   - `web/src/server/validation/url.ts`
2. Repositorio media admin:
   - `web/src/server/db/admin-media.ts`
3. Render y UX:
   - `web/src/components/media/ContentMediaPanel.tsx`
   - `web/src/components/admin/AdminMediaManager.tsx`
   - `web/src/app/learn/[courseSlug]/page.tsx`
   - `web/src/components/layout/Footer.tsx`
4. Catalogo:
   - `web/src/server/db/catalog.ts`
5. Seed/tests:
   - `web/prisma/seed.ts`
   - `web/tests/integration/admin-media.integration.test.ts`
