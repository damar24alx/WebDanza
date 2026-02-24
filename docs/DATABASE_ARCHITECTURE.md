# Arquitectura de Base de Datos

Fecha: 2026-02-23
Motor: PostgreSQL
ORM: Prisma
Schema: `web/prisma/schema.prisma`

## 1) Objetivo

Documentar la estructura de la base de datos del proyecto Danza para estudio, operacion y hardening continuo.

## 2) Dominios funcionales

1. Identidad y acceso
   - `User`, `PasswordResetToken`, `RateLimitEntry`
2. Catalogo editorial
   - `Style`, `Substyle`, `Move`, `Lesson`, `Course`
   - tablas puente: `MoveStyle`, `MoveSubstyle`, `LessonMove`, `CourseLesson`
3. Media y fuentes
   - `Media`, `MediaLink`, `Citation`, `CitationLink`
4. Aprendizaje y progreso
   - `UserProgress`, `UserLessonStepProgress`
5. Certificacion y logros
   - `Certificate`, `CertificateEvent`
6. Grafo historico/relacional
   - `Node`, `Connection`
7. Taxonomia tecnica/musical
   - `TechniqueConcept`, `MusicConcept`
   - tablas puente: `MoveTechniqueConcept`, `MoveMusicConcept`

## 3) Enums principales

- `EditorialStatus`: `draft`, `review`, `ready`, `published`
- `Difficulty`: `beginner`, `intermediate`, `advanced`
- `UserRole`: `ADMIN`, `EDITOR`, `REVIEWER`, `STUDENT`
- `MediaProvider`: `youtube`, `vimeo`, `other` (politica actual: uso operativo de `other`)
- `RightsStatus`: `unknown`, `ok_to_embed`, `restricted`, `blocked`
- `ProgressStatus`: `not_started`, `in_progress`, `completed`
- `LessonGateStatus`: `done`, `active`, `locked`
- `CourseCompletionRule`: `all_lessons`, `percent_90`
- `CertificateStatus`: `active`, `revoked`
- `CertificateEventType`: `issued`, `reissued`, `revoked`, `restored`
- `EntityType`: `style`, `substyle`, `move`, `lesson`, `course`, `connection`

## 4) Relaciones y cardinalidad (resumen)

1. `Style` 1:N `Substyle`
2. `Style` N:M `Move` via `MoveStyle`
3. `Substyle` N:M `Move` via `MoveSubstyle`
4. `Lesson` N:M `Move` via `LessonMove`
5. `Course` N:M `Lesson` via `CourseLesson`
6. `Course` 0..1:N `Style` (course puede no tener style)
7. `User` 1:N `UserProgress`
8. `User` 1:N `UserLessonStepProgress`
9. `User` 1:N `Certificate`
10. `Certificate` 1:N `CertificateEvent`
11. `Media` 1:N `MediaLink` (vinculo polimorfico por `entityType/entityId`)
12. `Citation` 1:N `CitationLink` (vinculo polimorfico por `entityType/entityId`)
13. `Node` 1:N `Connection` (from/to)
14. `Move` N:M `TechniqueConcept` y `MusicConcept` via tablas puente

## 5) Constraints de integridad clave

## 5.1 UserProgress

1. Unicidad por usuario+leccion: `@@unique([userId, lessonId])`
2. Unicidad por usuario+curso: `@@unique([userId, courseId])`
3. Check `percent` en rango 0..100 (migracion)
4. Check de objetivo obligatorio (`lessonId` o `courseId` no nulos simultaneamente vacios)

## 5.2 Connection

1. Unicidad logica `fromNodeId + toNodeId + connectionType`
2. Check de nodos distintos (`fromNodeId <> toNodeId`)
3. Check de `strength` en rango 1..5 (o null)

## 5.3 UserLessonStepProgress

1. Unicidad por `userId + lessonId + stepIndex`
2. Check `stepIndex >= 0` (migracion `20260223193000_*`)

## 5.4 Media

1. URL unica en `Media.url`
2. Check `durationSec >= 0` (o null) (migracion `20260223193000_*`)

## 5.5 Certificate

1. Unicidad `certificateCode`
2. Unicidad `userId + courseId`
3. Check de consistencia:
   - `active` => `revokedAt` debe ser `NULL`
   - `revoked` => `revokedAt` debe ser `NOT NULL`

## 6) Indices relevantes

- Slugs unicos en entidades principales (`Style/Substyle/Move/Lesson/Course`)
- `UserProgress`: indices por `userId`, `lessonId`, `courseId`
- `UserLessonStepProgress`: indices por `(userId, lessonId)` y `lessonId`
- `Certificate`: indice `(status, issuedAt)`
- `CertificateEvent`: indices por `(certificateId, createdAt)` y `(actorUserId, createdAt)`
- `MediaLink` y `CitationLink`: indice `(entityType, entityId)` para consultas por entidad
- `RateLimitEntry`: indice por `resetAt`

## 7) Flujos de datos criticos

1. Publicacion editorial
   - estado en `publishedStatus`
   - catalogo publico consume solo contenido publicado
2. Aprendizaje
   - checklist por paso en `UserLessonStepProgress`
   - progreso agregado en `UserProgress`
   - gating de lecciones basado en completitud real
3. Certificados
   - emision segun `completionRule`
   - verificacion por `certificateCode`
   - auditoria de cambios en `CertificateEvent`
4. Media interna
   - upload admin a storage interno
   - registro en `Media` + enlace en `MediaLink`
   - limpieza de huerfanos al desvincular ultima referencia

## 8) Integridad polimorfica (riesgo conocido)

`MediaLink` y `CitationLink` usan `entityId` string polimorfico y no pueden tener FK directa a todas las tablas de destino.

Mitigacion actual:
1. Validacion server-side de existencia antes de crear link.
2. Scripts de auditoria y reparacion:
   - `npm run db:audit-integrity`
   - `npm run db:repair-integrity`
3. Logging de links colgantes cuando aplica.

## 9) Seguridad y operacion de BD (recomendado para produccion)

1. Rol de aplicacion con privilegios minimos (sin `SUPERUSER`).
2. Usuario separado para migraciones.
3. Conexion cifrada y rotacion de credenciales.
4. Backups automaticos diarios + snapshots periodicos.
5. Simulacro de restore en staging al menos mensual.
6. Alertas sobre:
   - error-rate de queries
   - latencia p95/p99
   - crecimiento anomalo de tablas (`UserProgress`, `RateLimitEntry`, `Media*`, `CertificateEvent`)

## 10) Scripts y comandos utiles

Desde `web/`:

```bash
npx prisma validate
npx prisma migrate status
npm run db:audit-integrity
npm run db:repair-integrity        # dry-run
npm run db:repair-integrity -- --apply
```

## 11) Evolucion sugerida (post-MVP)

1. Implementar particionado o retention para `RateLimitEntry` y eventos extensivos.
2. Considerar almacenamiento dedicado de analytics/eventos fuera de OLTP.
3. Evolucionar enlaces polimorficos a estrategia con FK fuerte por tipo (si el costo de migracion se justifica).
4. Añadir capa de versionado de contenido editorial para trazabilidad avanzada.

