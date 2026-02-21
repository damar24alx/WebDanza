# Data Model v1

## 1) Objetivo
Definir modelo de datos MVP para enciclopedia + aprendizaje, dejando listo el soporte para conexiones historicas y evolucion a mapa/timeline/grafo visual en Fase 2.

## 2) ERD (texto)
```text
Style (1) ---- (N) Substyle
Style (N) ---- (N) Move            via MoveStyle
Substyle (N) ---- (N) Move         via MoveSubstyle
Move (N) ---- (N) TechniqueConcept via MoveTechniqueConcept
Move (N) ---- (N) MusicConcept     via MoveMusicConcept
Lesson (N) ---- (N) Move           via LessonMove
Course (N) ---- (N) Lesson         via CourseLesson (ordered)
Media (N) ---- (N) [Style|Substyle|Move|Lesson|Course] via MediaLink
Citation (N) ---- (N) [Style|Substyle|Move|Lesson|Course|Connection] via CitationLink
UserProgress (N) ---- (1) User
UserProgress (N) ---- (0..1) Lesson
UserProgress (N) ---- (0..1) Course
Certificate (N) ---- (1) User
Certificate (N) ---- (1) Course
Connection (N) ---- (1) Node(from)
Connection (N) ---- (1) Node(to)
Node (1) ---- (0..1) Style
Node (1) ---- (0..1) Substyle
Node (1) ---- (0..1) Move
```

Nota: `Node` es capa de referencia para permitir conexiones entre distintos tipos de entidad sin romper integridad.

## 3) Entidades minimas

### Style
- id (uuid, pk)
- slug (unique)
- name
- summary
- categoryPrimary
- historicalCulturalContext
- pedagogyOverview
- movementPrinciples
- musicalityBasics
- vocabularyCoreJson (jsonb)
- publishedStatus
- version (int, default 1)
- createdAt, updatedAt

### Substyle
- id (uuid, pk)
- styleId (fk -> Style)
- slug (unique)
- name
- summary
- historicalCulturalContext
- technicalFocus
- musicalFocus
- vocabularyFocusJson (jsonb)
- publishedStatus
- version
- createdAt, updatedAt

### Move
- id (uuid, pk)
- slug (unique)
- name
- summary
- moveType
- difficulty
- bodyMechanics
- stepByStep
- commonMistakes
- corrections
- safetyNotes
- publishedStatus
- version
- createdAt, updatedAt

### Lesson
- id (uuid, pk)
- slug (unique)
- title
- objective
- level
- durationMin
- lessonType
- steps
- successCriteria
- publishedStatus
- version
- createdAt, updatedAt

### Course
- id (uuid, pk)
- slug (unique)
- title
- summary
- targetLevel
- learningOutcomes
- completionRule
- certificateEligible
- publishedStatus
- version
- createdAt, updatedAt

### Media
- id (uuid, pk)
- provider (youtube, vimeo, other)
- url (unique)
- title
- durationSec (nullable)
- rightsStatus (unknown, ok_to_embed, restricted, blocked)
- createdAt, updatedAt

### Citation
- id (uuid, pk)
- sourceType
- title
- author
- year (nullable)
- url (nullable)
- accessedAt
- claimScope
- createdAt, updatedAt

### UserProgress
- id (uuid, pk)
- userId
- lessonId (nullable fk)
- courseId (nullable fk)
- status (not_started, in_progress, completed)
- percent (0-100)
- startedAt (nullable)
- completedAt (nullable)
- updatedAt

### Certificate
- id (uuid, pk)
- userId
- courseId
- issuedAt
- certificateCode (unique)
- metadataJson

### TechniqueConcept
- id (uuid, pk)
- slug (unique)
- name
- definition
- createdAt, updatedAt

### MusicConcept
- id (uuid, pk)
- slug (unique)
- name
- definition
- bpmMin (nullable)
- bpmMax (nullable)
- createdAt, updatedAt

### Node
- id (uuid, pk)
- nodeType (style, substyle, move)
- styleId (nullable, unique)
- substyleId (nullable, unique)
- moveId (nullable, unique)
- createdAt, updatedAt

### Connection
- id (uuid, pk)
- fromNodeId (fk -> Node)
- toNodeId (fk -> Node)
- connectionType (influence, derived, fusion, migration)
- strength (1-5, nullable)
- note
- startPeriod `PLACEHOLDER` (nullable)
- endPeriod `PLACEHOLDER` (nullable)
- createdAt, updatedAt

## 4) Tablas relacionales (many-to-many)
- MoveStyle(moveId, styleId, relevance)
- MoveSubstyle(moveId, substyleId, relevance)
- LessonMove(lessonId, moveId, orderIndex)
- CourseLesson(courseId, lessonId, orderIndex)
- MoveTechniqueConcept(moveId, techniqueConceptId)
- MoveMusicConcept(moveId, musicConceptId)
- MediaLink(mediaId, entityType, entityId, role)
- CitationLink(citationId, entityType, entityId)

## 5) Reglas de integridad y versionado
- Todos los `slug` son unicos por entidad; preferencia: unicos globales para URL limpias.
- Todas las entidades versionables tienen `version` + `updatedAt`.
- No se permite `published` si faltan campos obligatorios.
- No se permite `published` en Style/Substyle con `historicalCulturalContext` sin Citation vinculada.
- `UserProgress` debe apuntar a Lesson o Course (al menos uno).
- `Certificate` solo para Course con `certificateEligible=true`.
- `Connection` no permite `fromNodeId == toNodeId`.

## 6) MVP vs Fase 2
En MVP (Fase 1):
- CRUD base de entidades principales.
- Conexiones registradas en tabla `Connection` y visibles como lista.
- Media por links externos.
- Citations operativas para trazabilidad.

En Fase 2:
- Timeline interactivo y grafo visual de conexiones.
- Enriquecimiento temporal/geografico de Connection.
- Motor de recomendaciones basado en grafo.
- Validaciones semanticas avanzadas de conflictos historicos.

## 7) Borrador Prisma (referencial, no implementado en Fase 0)
```prisma
model Style {
  id        String   @id @default(uuid())
  slug      String   @unique
  name      String
  summary   String
  version   Int      @default(1)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Move {
  id        String   @id @default(uuid())
  slug      String   @unique
  name      String
  difficulty String
  version   Int      @default(1)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

Nota: esquema completo se implementa en Fase 1 siguiendo este documento.
