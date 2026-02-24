# PHASE 1A UI Parity Checklist

Fecha cierre funcional: 2026-02-22  
Objetivo: cerrar Fase 1A con cobertura de rutas/pantallas Stitch necesarias para iniciar Fase 1B.

## /
- [x] Hero con titulo principal + buscador prominente + trending chips
- [x] Bloque `Continue Learning` con progreso y CTA
- [x] Grid `Explore the Platform` de 3 accesos
- [x] Bloque `Trending This Week`

## /styles
- [x] Header de pagina con titulo + subtitulo
- [x] Sidebar de filtros (desktop) + trigger mobile
- [x] Barra de busqueda/sort/filtros activos
- [x] Grid de cards de styles con metadata y CTA
- [x] Estado empty real cuando no hay resultados

## /styles/[slug]
- [x] Hero del style con titulo grande y contexto
- [x] Navegacion de tabs/secciones (overview/history/technique/musicality/path)
- [x] Bloque `The Warehouse Roots`
- [x] Bloque `Core Techniques`
- [x] Bloque `Understanding the 4/4 Beat` / musicality
- [x] Bloque `Learning Path` + locked module

## /moves
- [x] Header `Step Dictionary` con descripcion
- [x] Filtros (query/family/difficulty) + chips activos + clear
- [x] Grid de moves con tags y CTA
- [x] Estado empty real cuando no hay resultados

## /moves/[slug]
- [x] Hero de move con nombre + family/tag
- [x] Bloque `Step-by-Step Technique`
- [x] Bloque `Common Mistakes`
- [x] Panel lateral `Instructor` / `Variations` / `Move Info`

## /learn
- [x] Hero de academia + CTA principal/secundario
- [x] Fila de stats (rutas/horas/certificables)
- [x] Filtros activos para cursos
- [x] Bloque `Explore Courses` con cards
- [x] Bloque `Trending This Week`
- [x] Estado empty real cuando no hay resultados

## /learn/[courseSlug]
- [x] Layout tipo player con sidebar de curriculo
- [x] Leccion activa con hero video placeholder
- [x] Bloques `Key Takeaways` y `Music in this lesson`
- [x] Estado locked consistente con CTA
- [x] Estado empty real si curso sin lessons
- [x] Componente `advanced_dance_video_controls` integrado

## /me
- [x] Header `My Dashboard`
- [x] Stats cards (streak/horas/certificados/nivel)
- [x] Bloque `Continue Learning`
- [x] Bloque `My Courses`
- [x] Bloque `Recent Badges` + actividad resumida

## /me/achievements
- [x] Hero de nivel/rank con progreso XP
- [x] Grid de medallas desbloqueadas/bloqueadas
- [x] Bloques de `Practice Streak` y `Knowledge`
- [x] Sidebar de leaderboard/actividad en desktop

## /pricing
- [x] Hero pricing con mensaje principal
- [x] Grid de planes (explorador/style-pack/pro/studio)
- [x] Bloque `Why Go Pro?`
- [x] Bloque `Earn Official Certificates`
- [x] Tabla `Compare Features`
- [x] Bloque `Frequently Asked Questions`

## /admin
- [x] Header `Moves Management` + toolbar de busqueda/acciones
- [x] Sidebar admin con secciones
- [x] Tabla de items con estado y accion
- [x] Densidad visual y jerarquia base alineada con Stitch

## /auth/login
- [x] Split layout visual (panel branding + panel formulario)
- [x] Form principal (email/password + CTA)
- [x] Bloque alternativo de acceso (social/secondary actions)
- [x] Jerarquia visual de cabeceras y copy cercana a Stitch

## /maps/lineage
- [x] Canvas/mapa con nodos y conexiones visuales
- [x] Filtros flotantes y herramientas de mapa
- [x] Timeline inferior con marcador temporal
- [x] Panel de detalle del nodo activo

## /maps/steps
- [x] Mapa genealogico de pasos con conexiones
- [x] Sidebar de detalle con relaciones
- [x] Timeline scrubber + controles flotantes
- [x] Header contextual con acciones (share/export)

## Pendientes no bloqueantes para hardening tecnico
- [ ] Paridad visual fina por pantalla (pixel polish y micro-interacciones).
- [ ] Unificar duplicidad de estados en `components/state` vs `components/states`.
- [ ] Ampliar tests de UI de estados mas alla de smoke.

Decision:
- Cobertura Stitch requerida para 1A/1A.1 completada.
- La fase queda lista para iniciar 1B.
