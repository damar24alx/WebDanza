# MVP Execution Plan

Fecha de inicio: 2026-02-22
Meta: cerrar Fase 1 (MVP funcional) con evidencia tecnica y de producto.

## Alcance y foco

- En foco: Epicas E3, E4, E5, E6 (historias Must restantes)
- Fuera de foco temporal:
  - red social (separada en otra app)
  - streaming propio y convenios institucionales (fases posteriores)

## Roadmap operativo por sprints

Duracion sugerida: 5 sprints de 2 semanas (10 semanas).

### Sprint 1 (Semanas 1-2)
- Objetivo: cerrar E3-S3 y dejar E3-S4 casi completo
- Entregables:
  - gestion media links por entidad (Move/Lesson/Course/Style/Substyle)
  - validaciones provider + rightsStatus en backend/admin
  - UI fallback de media bloqueada/restringida
  - tests de integracion para media/citation links

### Sprint 2 (Semanas 3-4)
- Objetivo: cerrar E3-S4 + E4-S1
- Entregables:
  - citation management extendido (incluye lesson/course/connection)
  - vistas de sources activas por entidad
  - checklist de lesson con persistencia real por usuario

### Sprint 3 (Semanas 5-6)
- Objetivo: cerrar E4-S2, E4-S3, E4-S4
- Entregables:
  - gating real de lessons por regla de completitud
  - persistencia robusta de UserProgress
  - CTA "continuar donde quedaste" por ultimo progreso in_progress

### Sprint 4 (Semanas 7-8)
- Objetivo: cerrar E5-S1, E5-S2, E5-S3
- Entregables:
  - regla de elegibilidad certificable
  - emision real de certificados con codigo unico
  - verificador publico y vista de certificado MVP

### Sprint 5 (Semanas 9-10)
- Objetivo: cerrar E6-S1, E6-S2, E6-S3, E6-S4 + hardening release
- Entregables:
  - metadata SEO por entidad + sitemap + robots
  - presupuesto performance documentado y medido
  - logs estructurados + endpoint health
  - pase final de regresion y release notes

## Metas de control por sprint

- DoD obligatorio por historia: `docs/DEFINITION_OF_DONE.md`
- Gate tecnico por merge:
  - `npm run lint`
  - `npx tsc --noEmit`
  - `npm run build`
  - `npm run test:integration`
  - `npm run test:smoke`

## Flujo de trabajo con agente IA en VS Code

1. Tomar 1 historia Must por vez (nunca mezclar concerns)
2. Crear rama: `feat/<scope>-<short-name>` o `fix/<scope>-<short-name>`
3. Implementar en PR pequeno
4. Ejecutar gates tecnicos
5. Actualizar docs de estado:
   - `docs/MVP_STATUS_MATRIX.md`
   - `docs/HANDOFF_STATUS_v3.md`
6. Cerrar historia solo con evidencia de AC

## Riesgos y mitigacion en ejecucion

- Riesgo: scope creep por vision amplia
  - Mitigacion: proteger alcance Must de Fase 1
- Riesgo: deuda por mezclar UI polish con backend
  - Mitigacion: separar PR funcional vs PR visual
- Riesgo: regresiones silenciosas
  - Mitigacion: ampliar integracion/smoke cada sprint

## KPIs de cierre MVP (operativos)

- 24/24 historias Must en DONE
- 100% claims historicos publicados con citation
- flujo completo `explorar -> aprender -> progreso -> certificado` operativo
- 0 fallas en suite tecnica en rama release
