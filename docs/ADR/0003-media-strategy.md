# ADR 0003 - Estrategia de media MVP (links externos) y migracion futura

- Estado: Aceptado
- Fecha: 2026-02-21

## Contexto
Se requiere contenido audiovisual para aprendizaje, pero en MVP no se desea asumir costo/operacion de storage y streaming propio.

## Decision
En MVP usar entidad `Media` con links externos (YouTube/Vimeo) y metadata minima. Preparar modelo para migracion a CDN/streaming propio en fases posteriores.

## Razonamiento
- Reduce tiempo de salida a mercado.
- Disminuye costo inicial de infraestructura.
- Permite probar valor de aprendizaje antes de invertir en pipeline de video propio.

## Consecuencias
Positivas:
- Implementacion rapida.
- Menor carga operativa en Fase 1.

Negativas:
- Dependencia de terceros (bloqueos, cambios de politica, caidas).
- Experiencia inconsistente segun proveedor.

## Mitigaciones
- Guardar `rightsStatus` y validar provider.
- Mostrar fallback cuando el embed falle.
- Diseñar `MediaLink` desacoplado del proveedor.

## Politica de `rightsStatus` en MVP
- `unknown`: default al crear media; no bloquear draft.
- `ok_to_embed`: permitido para publicacion.
- `restricted`: permitido solo en borrador/revision con aviso.
- `blocked`: no publicar ni mostrar embed en vistas publicas.

## Plan de migracion (Fase 2+)
1. Introducir almacenamiento controlado y pipeline de transcodificacion.
2. Mantener `Media` como abstraccion unica de consumo.
3. Migrar por lotes sin romper URLs internas.

## Alternativas consideradas
- Subida de video propia desde MVP: descartado por costo y complejidad temprana.
