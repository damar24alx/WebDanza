# ADR 0005 - Progreso granular por checklist y gating secuencial

Fecha: 2026-02-23
Estado: Accepted

## Contexto

El flujo de aprendizaje del MVP necesitaba cerrar `E4-S1..E4-S4` con:

1. Checklist por paso persistente por usuario/leccion.
2. Reglas de bloqueo reales (no solo `gateStatus` seed estatico).
3. Reanudacion exacta (leccion y paso pendiente).
4. Recalculo determinista de progreso por leccion/curso.

El modelo existente (`UserProgress`) era suficiente para progreso agregado, pero no para estado granular por paso.

## Decision

Se adopta una estrategia de doble nivel:

1. Persistencia granular en `UserLessonStepProgress`:
   - Clave unica `userId + lessonId + stepIndex`.
   - Un registro por paso marcado.
2. Persistencia agregada en `UserProgress`:
   - Se recalcula en cada mutacion a partir del checklist real.
   - `lesson.percent` y `course.percent` se sincronizan de forma determinista.
3. Gating secuencial:
   - Solo la primera leccion incompleta queda `active`.
   - Lecciones posteriores quedan `locked`.
4. API de progreso:
   - `POST /api/progress/lessons/steps/toggle`
   - `POST /api/progress/lessons/complete`
   - Contrato uniforme de errores `422 + formError + fieldErrors`.

## Consecuencias

Positivas:

1. Progreso exacto por paso sin ambiguedad.
2. Bloqueo/desbloqueo coherente entre `/learn`, `/me` y catalogo.
3. Reanudacion exacta (`resumeLessonSlug`, `resumeStepIndex`).
4. Base compatible con certificados por regla real.

Tradeoffs:

1. Mayor costo de escritura por recalculo en cada mutacion.
2. Necesidad de pruebas adicionales para evitar regresiones de secuencia.
3. `gateStatus` seed queda como fallback editorial, no como fuente de verdad del progreso de usuario.

## Implementacion asociada

1. Prisma:
   - `UserLessonStepProgress` + migracion dedicada.
2. Backend:
   - `web/src/server/db/progress.ts`
   - `web/src/server/validation/progress.ts`
   - rutas API de progreso.
3. UI:
   - Checklist interactivo en `web/src/app/learn/[courseSlug]/page.tsx`.
   - Reanudacion exacta en `web/src/app/learn/page.tsx` y `web/src/app/me/page.tsx`.
