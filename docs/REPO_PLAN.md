# Repo Plan - MVP

## 1) Stack (fijado)
- Next.js (App Router) + TypeScript
- TailwindCSS
- PostgreSQL + Prisma
- NextAuth (arranca en Fase 1)
- Media MVP por links externos (YouTube/Vimeo) con entidad `Media`

## 1.1) Defaults operativos cerrados
- Idioma base de contenido: Espanol neutro.
- Marca visual de referencia: mixto (enciclopedia clara + academia moderna).
- DB local de desarrollo: PostgreSQL en Docker (estandar recomendado).
- Certificado MVP: vista web + codigo verificable (sin PDF en fase inicial).
- Admin inicial: uso interno con roles `Admin`, `Editor`, `Reviewer`.

## 2) Estructura de carpetas propuesta
```text
/docs
  /ADR
  PROJECT_BRIEF.md
  TAXONOMY.md
  CONTENT_TEMPLATES.md
  DATA_MODEL.md
  DEFINITION_OF_DONE.md
  REPO_PLAN.md

/src
  /app
  /components
  /features
    /styles
    /moves
    /lessons
    /courses
    /progress
    /certificates
  /lib
  /server
    /db
    /auth
  /styles

/prisma
  schema.prisma
  /migrations
  seed.ts

/tests
  /unit
  /integration

/scripts
```

## 3) Convenciones
- Lenguaje: TypeScript estricto.
- Nomenclatura:
- Archivos React en `PascalCase.tsx`.
- Utilidades y modulos en `kebab-case.ts`.
- Slugs en `kebab-case`.
- Estados editoriales: `draft`, `review`, `ready`, `published`.
- Enums de dominio centralizados en `/src/lib/domain`.

## 4) Estrategia de PR
- Una cosa por PR.
- Maximo recomendado: 300 lineas netas por PR (excepto migraciones/documentacion grande justificada).
- No mezclar refactor con feature.
- PR debe incluir:
- Contexto del cambio.
- Criterios de aceptacion cubiertos.
- Riesgos y plan de rollback.
- Evidencia de pruebas.

## 5) Politica de ramas
- `feat/<scope>-<short-name>`
- `fix/<scope>-<short-name>`
- `chore/<scope>-<short-name>`

## 6) Formato de commit
Convencion recomendada:
- `feat(scope): descripcion breve`
- `fix(scope): descripcion breve`
- `chore(scope): descripcion breve`
- `docs(scope): descripcion breve`

Ejemplo:
- `feat(moves): add move tags filters`

## 7) Checklist minimo de merge
- [ ] Build local pasa.
- [ ] Lint/format sin errores criticos.
- [ ] Pruebas minimas ejecutadas.
- [ ] Docs actualizadas.
- [ ] ADR creada si hubo decision de arquitectura.

## 8) Regla ADR
Crear ADR en `docs/ADR/` cuando cambie:
- Modelo de datos base.
- Estrategia de media.
- Infraestructura o arquitectura de alto impacto.
