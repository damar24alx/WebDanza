# Fase 1A: UI estática basada en Stitch

## Fuente oficial de UI
- /design/stitch/**/screen.png (referencia visual)
- /design/stitch/**/code.html (estructura)
- /design/ROUTING_MAP.md (rutas)

## Reglas
- No copiar HTML literal.
- Reimplementar en Next.js (App Router) + Tailwind con componentes reutilizables.
- Implementar primero UI estática con data mock (archivos JSON/TS).
- Incluir estados: loading / empty / error / locked (por plan).
- Toda la app vive en /web.

## Rutas MVP (mínimas)
- /, /styles, /styles/[slug], /substyles/[slug], /moves, /moves/[slug],
  /learn, /learn/[courseSlug], /me, /me/certificates, /pricing,
  /admin, /admin/review, /auth/login, /auth/register, /auth/recovery,
  /404 y /error.
