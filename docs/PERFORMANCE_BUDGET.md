# Presupuesto de Performance MVP

Fecha de actualizacion: 2026-02-23
Alcance: paginas core (`/`, `/styles`, `/moves`, `/learn`, `/learn/[courseSlug]`, `/styles/[slug]`, `/moves/[slug]`)

## Metas tecnicas (budget)

| KPI | Objetivo MVP | Umbral de alerta |
|---|---:|---:|
| LCP (p75, mobile) | <= 2.8s | > 3.2s |
| TTFB (p75) | <= 800ms | > 1000ms |
| JS inicial por ruta core | <= 180 KB gzip | > 220 KB gzip |
| CSS inicial por ruta core | <= 70 KB gzip | > 90 KB gzip |
| Error rate 5xx | < 1% | >= 1% |

## Estado actual local (build de referencia)

Fuente:
- `npm run build` en `web/`
- salida de tamano por rutas de Next.js (App Router)
- medicion de artefactos en `.next/static/chunks` (raw + gzip)

Resultado del ultimo build validado:
- Build: OK (2026-02-23).
- Rutas generadas: 54 (App Router, incluye `robots` y `sitemap`).
- Bundle JS total (chunks, gzip): 189,659 bytes (~185.2 KB).
- Bundle CSS total (chunks, gzip): 12,031 bytes (~11.8 KB).
- Archivo JS mas grande (gzip): `ccf6f963af30d36c.js` -> 70,150 bytes (~68.5 KB).
- Observacion: el total JS gzip esta apenas sobre el objetivo de 180 KB y requiere optimizacion incremental.

## Acciones de control activas

1. Revisar tamano de bundle en cada cierre de lote (`npm run build`).
2. Priorizar componentes server-side en rutas de catalogo.
3. Mantener media como enlaces externos con fallback por `rightsStatus`.
4. Evitar dependencias grandes no esenciales en rutas publicas.

## Siguiente mejora recomendada

1. Automatizar reporte de Web Vitals en cliente para medir LCP/TTFB reales por ruta.
2. Crear gate CI para budget de bundle por ruta critica.
