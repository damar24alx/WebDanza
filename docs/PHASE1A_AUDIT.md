# PHASE 1A Audit (UI Estatica)

Fecha: 2026-02-21  
Alcance: auditoria funcional y de consistencia (sin cambios de codigo de producto).

## Fuentes revisadas
- `design/ROUTING_MAP.md`
- `design/stitch/**/code.html` + `screen.png`
- `docs/DEFINITION_OF_DONE.md`
- Rutas reales en `web/src/app`

## Comandos ejecutados
- `cd web && npm run lint` -> OK (sin errores)
- `cd web && npm run build` -> OK (sin errores)

## 1) Tabla de rutas (Expected vs Actual)

| Expected (Routing Map) | Stitch Ref | Actual en `web/src/app` | Status | Prioridad | Nota |
|---|---|---|---|---|---|
| `/` | `dance_platform_home` | `src/app/page.tsx` | Implementada | P1 | Estructura principal presente; paridad visual parcial vs Stitch. |
| `/styles` | `explore_dance_styles` | `src/app/styles/page.tsx` | Implementada | P1 | Filtros/sort/chips presentes en version reducida. |
| `/styles/[slug]` | `style_detail__house_dance` | `src/app/styles/[slug]/page.tsx` | Implementada | P1 | Secciones core presentes; contenido mas simple que Stitch. |
| `/substyles/[slug]` | `substyle_detail__litefeet` | `src/app/substyles/[slug]/page.tsx` | Implementada | P1 | Tabs + bloques presentes; profundidad visual menor. |
| `/moves` | `step_dictionary_&_filter_system` | `src/app/moves/page.tsx` | Implementada | P1 | Listado y filtros base presentes; comportamiento de estados es demostrativo. |
| `/moves/[slug]` | `move_breakdown__the_shuffle` | `src/app/moves/[slug]/page.tsx` | Implementada | P1 | Breakdown, mistakes, info presentes; player/media simplificado. |
| `/learn` | `dance_academy_courses` | `src/app/learn/page.tsx` | Implementada | P1 | Catalogo y hero presentes; menor riqueza editorial/visual. |
| `/learn/[courseSlug]` | `course_player__hip_hop_foundations` | `src/app/learn/[courseSlug]/page.tsx` | Implementada | P1 | Sidebar + leccion activa + locked presentes; sin estados dedicados de carga/error. |
| `/me` | `student_profile_dashboard` | `src/app/me/page.tsx` | Implementada | P1 | Dashboard base correcto; faltan bloques de actividad/achievements de Stitch. |
| `/me/certificates` | `course_completion_certificate` | `src/app/me/certificates/page.tsx` | Implementada | P1 | Certificado renderizado; version visual simplificada. |
| `/pricing` | `dance_platform_pricing_plans` | `src/app/pricing/page.tsx` | Implementada | P1 | Planes + comparativa + FAQ presentes; diferencias visuales menores. |
| `/admin` | `content_admin_dashboard` | `src/app/admin/page.tsx` | Implementada | P1 | Tabla y flujo base presentes; densidad UI menor. |
| `/admin/review` | `admin_content_review_interface` | `src/app/admin/review/page.tsx` | Implementada | P1 | Checklist y acciones presentes; layout simplificado. |
| `/auth/login` | `desktop_login_screen` | `src/app/auth/login/page.tsx` | Implementada | P1 | Pantalla completa presente; menor detalle visual. |
| `/auth/register` | `desktop_registration_screen` | `src/app/auth/register/page.tsx` | Implementada | P1 | Flujo base presente; menos elementos de marca que Stitch. |
| `/auth/recovery` | `desktop_password_recovery` | `src/app/auth/recovery/page.tsx` | Implementada | P1 | Form + success card presentes; interaccion simplificada. |
| `/404` | `global_system_&_error_states` | `src/app/404/page.tsx` | Implementada | P1 | Estado 404 presente y funcional. |
| `/error` | `global_system_&_error_states` | `src/app/error/page.tsx` + `src/app/error.tsx` | Implementada | P1 | Ruta error + error boundary presentes. |

### Future (No bloquea MVP)

| Expected Future | Actual | Status | Prioridad |
|---|---|---|---|
| `/maps/lineage` | No existe | No implementada | P2 |
| `/maps/steps` | No existe | No implementada | P2 |
| `/me/achievements` | No existe | No implementada | P2 |
| `advanced_dance_video_controls` (componente) | No existe | No implementado | P2 |

## 2) Bugs / Hallazgos

### P0 (bloqueantes)
- Ningun faltante P0 en rutas MVP core del `ROUTING_MAP`.
- No se detectaron links internos activos apuntando a rutas inexistentes.

### P1 (incompletas / calidad)
1. Paridad visual incompleta vs Stitch en casi todas las vistas core (estructura base OK, detalle visual y densidad UI reducidos).
2. Estados `loading/empty/error` no estan aplicados de forma consistente en todos los listados:
   - `moves` muestra `LoadingState` y `EmptyState`, pero como bloques estaticos de demo.
   - `styles` y `learn` no tienen estados dedicados equivalentes.
3. Player de curso (`/learn/[courseSlug]`) cubre estado `locked`, pero no tiene variantes explicitas de `loading/empty/error` del propio player.
4. DoD accesibilidad basica: formularios de auth dependen de placeholder y no exponen labels visibles/semanticos completos.
5. DoD pruebas minimas: no hay evidencia de tests unitarios/integracion para esta fase (`docs/DEFINITION_OF_DONE.md`).

### P2 (futuro/no bloqueante)
1. Rutas futuras del mapa no implementadas (`/maps/*`, `/me/achievements`).
2. Componente de controles avanzados de video no implementado.

## 3) Navegacion interna (links)

Resultado de auditoria de `Link href`/`href` en `web/src`:
- Links activos detectados apuntan a rutas existentes en `web/src/app`.
- No se detectaron enlaces rotos activos.
- Entradas marcadas como futuras en sidebars estan en modo muted (sin href activo), por lo que no rompen navegacion.

## 4) Slugs en mocks vs URLs

Resultado:
- `stylesMock.slug` coincide con `/styles/[slug]` usado en links.
- `substylesMock.slug` coincide con `/substyles/[slug]`.
- `movesMock.slug` coincide con `/moves/[slug]`.
- `coursesMock.slug` coincide con `/learn/[courseSlug]`.
- Referencias cruzadas (`styleSlug`, `styleSlugs`, `courseSlug` en user/certificados) no presentan mismatch detectado.

## 5) Plan de fixes (3 tandas)

### Tanda 1 - P0 (inmediato)
1. Mantener bloqueado merge de features hasta conservar 0 rutas faltantes (actualmente cumplido).
2. Revalidar automaticamente links internos en CI (script de rutas/hrefs).

### Tanda 2 - P1 (paridad y DoD)
1. Cerrar paridad visual por pantalla (layout spacing/jerarquia/elementos faltantes) siguiendo `screen.png`/`code.html`.
2. Implementar estados condicionales reales (`loading/empty/error/locked`) en listados (`styles`, `moves`, `learn`) y player.
3. Endurecer accesibilidad en auth/forms (labels, `aria-*`, foco teclado visible).
4. Agregar pruebas minimas de smoke de rutas y estados core.

### Tanda 3 - P2 (post-MVP core)
1. Implementar `/maps/lineage` y `/maps/steps`.
2. Implementar `/me/achievements`.
3. Crear `advanced_dance_video_controls` reusable para player.
