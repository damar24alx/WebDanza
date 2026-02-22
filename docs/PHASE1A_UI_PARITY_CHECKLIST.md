# PHASE 1A UI Parity Checklist

Fecha: 2026-02-21  
Objetivo: acercar la UI de rutas core a la jerarquia y bloques de Stitch sin reinventar pantallas.

## /
- [ ] Hero con titulo principal + buscador prominente + trending chips
- [ ] Bloque `Continue Learning` con progreso y CTA
- [ ] Grid `Explore the Platform` de 3 accesos
- [ ] Bloque `Trending This Week`

## /styles
- [ ] Header de pagina con titulo + subtitulo
- [ ] Sidebar de filtros (desktop) + trigger mobile
- [ ] Barra de busqueda/sort/filtros activos
- [ ] Grid de cards de styles con metadata y CTA
- [ ] Estado empty real cuando no hay resultados

## /styles/[slug]
- [ ] Hero del style con titulo grande y contexto
- [ ] Navegacion de tabs/secciones (overview/history/technique/musicality/path)
- [ ] Bloque `The Warehouse Roots`
- [ ] Bloque `Core Techniques`
- [ ] Bloque `Understanding the 4/4 Beat` / musicality
- [ ] Bloque `Learning Path` + locked module

## /moves
- [ ] Header `Step Dictionary` con descripcion
- [ ] Filtros (query/family/difficulty) + chips activos + clear
- [ ] Grid de moves con tags y CTA
- [ ] Estado empty real cuando no hay resultados

## /moves/[slug]
- [ ] Hero de move con nombre + family/tag
- [ ] Bloque `Step-by-Step Technique`
- [ ] Bloque `Common Mistakes`
- [ ] Panel lateral `Instructor` / `Variations` / `Move Info`

## /learn
- [ ] Hero de academia + CTA principal/secundario
- [ ] Fila de stats (rutas/horas/certificables)
- [ ] Filtros activos para cursos
- [ ] Bloque `Explore Courses` con cards
- [ ] Bloque `Trending This Week`
- [ ] Estado empty real cuando no hay resultados

## /learn/[courseSlug]
- [ ] Layout tipo player con sidebar de curriculo
- [ ] Leccion activa con hero video placeholder
- [ ] Bloques `Key Takeaways` y `Music in this lesson`
- [ ] Estado locked consistente con CTA
- [ ] Estado empty real si curso sin lessons

## /me
- [ ] Header `My Dashboard`
- [ ] Stats cards (streak/horas/certificados/nivel)
- [ ] Bloque `Continue Learning`
- [ ] Bloque `My Courses`
- [ ] Bloque `Recent Badges` + actividad resumida

## /pricing
- [ ] Hero pricing con mensaje principal
- [ ] Grid de planes (explorador/style-pack/pro/studio)
- [ ] Bloque `Why Go Pro?`
- [ ] Bloque `Earn Official Certificates`
- [ ] Tabla `Compare Features`
- [ ] Bloque `Frequently Asked Questions`

## /admin
- [ ] Header `Moves Management` + toolbar de busqueda/acciones
- [ ] Sidebar admin con secciones
- [ ] Tabla de items con estado y accion
- [ ] Densidad visual y jerarquia cercana a Stitch

## /auth/login
- [ ] Split layout visual (panel branding + panel formulario)
- [ ] Form principal (email/password + CTA)
- [ ] Bloque alternativo de acceso (social/secondary actions)
- [ ] Jerarquia visual de cabeceras y copy cercana a Stitch
