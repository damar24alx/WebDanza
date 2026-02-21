# ADR 0002 - Modelo de contenido con conexiones historicas

- Estado: Aceptado
- Fecha: 2026-02-21

## Contexto
El producto necesita representar conocimiento de danza (styles, substyles, moves, lessons, courses) y tambien relaciones historicas/culturales entre nodos.

## Decision
Usar modelo de entidades normalizadas con `Connection` tipada (`influence`, `derived`, `fusion`, `migration`) y capa `Node` para referenciar distintos tipos de entidad.

## Razonamiento
- Permite registrar conexiones desde MVP sin obligar visualizacion avanzada inmediata.
- Evita redisenar datos al llegar a timeline/grafo de Fase 2.
- Mantiene trazabilidad de afirmaciones mediante `CitationLink`.

## Consecuencias
Positivas:
- Escalabilidad conceptual del dominio.
- Base preparada para features de descubrimiento y recomendacion.

Negativas:
- Mayor complejidad de validaciones semanticas.
- Requiere disciplina editorial para evitar conexiones sin evidencia.

## Reglas asociadas
- Ninguna afirmacion historica/cultural sin Citation.
- Conexiones sin fuente deben quedar en draft como `PLACEHOLDER`.

## Alternativas consideradas
- Guardar conexiones como texto libre en cada entidad: descartado por baja consultabilidad.
- Postergar conexiones hasta Fase 2: descartado por riesgo de retrabajo estructural.

## Seguimiento
- Definir score de confianza por conexion en Fase 2.
