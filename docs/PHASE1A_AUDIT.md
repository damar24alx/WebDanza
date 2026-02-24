# PHASE 1A Audit (UI estatica + hardening funcional)

Fecha: 2026-02-22
Alcance: auditoria final de cierre de Fase 1A + 1A.1 para habilitar inicio de Fase 1B.

## Fuentes revisadas
- `design/ROUTING_MAP.md`
- `design/stitch/**/code.html` + `screen.png`
- `docs/DEFINITION_OF_DONE.md`
- `docs/PHASE1A_UI_PARITY_CHECKLIST.md`
- Rutas reales en `web/src/app`

## Comandos ejecutados (2026-02-22)
- `cd web && npm run lint` -> OK
- `cd web && npm run build` -> OK
- `cd web && npm run test:smoke` -> OK (13/13)

Nota tecnica:
- Se ajusto `web/playwright.config.ts` para ejecutar smoke con `next dev --webpack` y evitar un panic intermitente de Turbopack en entorno local.

## 1) Tabla de rutas (Expected vs Actual)

| Expected (Routing Map) | Stitch Ref | Actual en `web/src/app` | Status | Prioridad | Nota |
|---|---|---|---|---|---|
| `/` | `dance_platform_home` | `src/app/page.tsx` | Implementada | P1 | Hero + buscador funcional.
| `/styles` | `explore_dance_styles` | `src/app/styles/page.tsx` | Implementada | P1 | Filtros por URL y sidebar clickable.
| `/styles/[slug]` | `style_detail__house_dance` | `src/app/styles/[slug]/page.tsx` | Implementada | P1 | Secciones core + tabs con anchors.
| `/substyles/[slug]` | `substyle_detail__litefeet` | `src/app/substyles/[slug]/page.tsx` | Implementada | P1 | Tabs con anchors + moves enlazados.
| `/moves` | `step_dictionary_&_filter_system` | `src/app/moves/page.tsx` | Implementada | P1 | Filtros por URL y sidebar clickable.
| `/moves/[slug]` | `move_breakdown__the_shuffle` | `src/app/moves/[slug]/page.tsx` | Implementada | P1 | CTA "Mark as practiced" conectado.
| `/learn` | `dance_academy_courses` | `src/app/learn/page.tsx` | Implementada | P1 | Hero, filtros y cards funcionales.
| `/learn/[courseSlug]` | `course_player__hip_hop_foundations` | `src/app/learn/[courseSlug]/page.tsx` | Implementada | P1 | Player estable + lesson switch por query.
| `/me` | `student_profile_dashboard` | `src/app/me/page.tsx` | Implementada | P1 | Dashboard y feedback de practica.
| `/me/certificates` | `course_completion_certificate` | `src/app/me/certificates/page.tsx` | Implementada | P1 | Validacion de codigo funcional.
| `/pricing` | `dance_platform_pricing_plans` | `src/app/pricing/page.tsx` | Implementada | P1 | CTAs de planes, FAQ anchor y contacto.
| `/admin` | `content_admin_dashboard` | `src/app/admin/page.tsx` | Implementada | P1 | Busqueda/filtros/sort funcionales.
| `/admin/review` | `admin_content_review_interface` | `src/app/admin/review/page.tsx` | Implementada | P1 | Aprobacion/rechazo por query y tabs navegables.
| `/auth/login` | `desktop_login_screen` | `src/app/auth/login/page.tsx` | Implementada | P1 | CTAs de login/social sin botones muertos.
| `/auth/register` | `desktop_registration_screen` | `src/app/auth/register/page.tsx` | Implementada | P1 | CTA principal funcional.
| `/auth/recovery` | `desktop_password_recovery` | `src/app/auth/recovery/page.tsx` | Implementada | P1 | Envio/reenvio de enlace por query.
| `/404` | `global_system_&_error_states` | `src/app/404/page.tsx` | Implementada | P1 | 404 funcional.
| `/error` | `global_system_&_error_states` | `src/app/error/page.tsx` + `src/app/error.tsx` | Implementada | P1 | Error route + retry funcional.
| `/maps/lineage` | `interactive_dance_lineage_map` | `src/app/maps/lineage/page.tsx` | Implementada | P2 | Controles de capa/nodo/zoom/timeline funcionales.
| `/maps/steps` | `step_evolution_genealogy_map` | `src/app/maps/steps/page.tsx` | Implementada | P2 | Seleccion de nodo, zoom, timeline y acciones funcionales.
| `/me/achievements` | `student_achievements_and_medals` | `src/app/me/achievements/page.tsx` | Implementada | P2 | CTA leaderboard conectado.

Componente Future de Stitch:
- `advanced_dance_video_controls` -> implementado como `web/src/components/media/AdvancedVideoControls.tsx` e integrado en `web/src/app/learn/[courseSlug]/page.tsx`.

## 2) Hallazgos

### P0 (bloqueantes)
- Ningun faltante P0 en rutas MVP core ni en rutas Stitch Future priorizadas.
- No se detectaron enlaces activos rotos en navegacion principal.
- No se detectaron controles principales inservibles en rutas auditadas.

### P1 (abiertos, no bloquean inicio de 1B)
1. Paridad visual fina vs Stitch aun parcial en algunas pantallas (micro-spacing y polish visual).
2. Existe duplicidad de componentes entre `web/src/components/state` y `web/src/components/states`.
3. Cobertura automatizada de UI mas alla de smoke aun pendiente.

### P2
- Sin pendientes P2 derivados del `ROUTING_MAP` o de pantallas Stitch Future.

## 3) Navegacion interna (links)

Resultado de auditoria de `Link href`/`href` en `web/src`:
- Links activos detectados apuntan a rutas existentes en `web/src/app`.
- No se detectaron enlaces rotos activos.
- Se eliminaron CTAs sin accion en rutas core (auth, pricing, admin, maps, profile/certificates).

## 4) Slugs en mocks vs URLs

Resultado:
- `stylesMock.slug` coincide con `/styles/[slug]`.
- `substylesMock.slug` coincide con `/substyles/[slug]`.
- `movesMock.slug` coincide con `/moves/[slug]`.
- `coursesMock.slug` coincide con `/learn/[courseSlug]`.
- Referencias cruzadas en mocks sin mismatch detectado.

## 5) Gate de cierre de fase

Decision de auditoria:
- `PHASE 1A`: **CERRADA (funcional + hardening de controles completado)** para iniciar `PHASE 1B`.
- Pendientes remanentes se limitan a hardening visual/tecnico no bloqueante.

Referencias:
- `docs/PHASE1A_CLOSEOUT.md`
- `BACKLOG_MVP.md`
