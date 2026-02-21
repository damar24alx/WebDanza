# AGENTS.md

## Objetivo
Reglas operativas para agentes Codex que trabajen en este repositorio.

## Lectura obligatoria antes de actuar
1. Leer `docs/PROJECT_BRIEF.md`.
2. Leer `BACKLOG_MVP.md`.
3. Revisar `docs/DATA_MODEL.md` si hay cambios de datos.

## Reglas de colaboracion
- Hacer PRs pequenos: una cosa por PR.
- No mezclar refactors con features.
- Si aparece una decision de arquitectura, crear ADR en `docs/ADR/`.
- Mantener trazabilidad entre historia de backlog y cambios del PR.

## Convencion de ramas
- `feat/<scope>-<short-name>`
- `fix/<scope>-<short-name>`
- `chore/<scope>-<short-name>`

## Formato de commits
Usar Conventional Commits:
- `feat(scope): short description`
- `fix(scope): short description`
- `chore(scope): short description`
- `docs(scope): short description`

Ejemplos:
- `feat(content): add style editorial validation`
- `fix(progress): prevent percent overflow`

## Plantilla de PR (obligatoria)
Copiar y completar:

```md
## Summary
- What changed:
- Why:

## Backlog Link
- Epic/Story: E?-S?

## Acceptance Criteria
- [ ] AC1
- [ ] AC2
- [ ] AC3

## Scope Control
- [ ] Single concern PR
- [ ] No hidden refactor mixed with feature

## Testing
- [ ] Unit tests
- [ ] Integration tests
- [ ] Manual QA evidence

## Data/Schema
- [ ] No schema change
- [ ] Schema change included
- [ ] Migration tested

## Docs
- [ ] Updated relevant docs
- [ ] ADR added (if architecture decision)

## Risks and Rollback
- Risk:
- Rollback plan:
```

## Definition of Ready para tomar una historia
- Tiene descripcion clara.
- Tiene criterios de aceptacion verificables.
- Tiene dependencias listadas.
- Tiene estimacion.

## Definition of Done para cerrar una historia
- Cumple `docs/DEFINITION_OF_DONE.md`.
- PR aprobado y mergeado.
- Documentacion actualizada.

## Restricciones de Fase 0
- No construir features de UI/producto final.
- Solo documentacion y definicion de modelo.
- No introducir "hechos historicos" sin Citation/Source.
