# ADR 0001 - Stack base (Next.js + Prisma + PostgreSQL)

- Estado: Aceptado
- Fecha: 2026-02-21

## Contexto
Se requiere una plataforma de contenido + aprendizaje con evolucion a producto de datos rico (conexiones, progreso, certificados) y velocidad de iteracion alta para MVP.

## Decision
Adoptar stack:
- Next.js (App Router) + TypeScript
- TailwindCSS
- PostgreSQL + Prisma
- NextAuth en Fase 1

## Razonamiento
- Next.js App Router permite SSR/SSG/hibrido util para SEO y rendimiento inicial.
- TypeScript reduce errores de integracion entre dominio, UI y capa de datos.
- PostgreSQL soporta relaciones complejas y crecimiento hacia analitica.
- Prisma acelera modelado, migraciones y consistencia de tipos.

## Consecuencias
Positivas:
- Desarrollo rapido con base solida para escalar.
- Buen soporte para contenido relacional y consultas complejas.

Negativas:
- Necesidad de disciplina en migraciones y control de query performance.
- Curva de aprendizaje para App Router y patrones server/client.

## Alternativas consideradas
- MERN puro con MongoDB: descartado por menor adecuacion para relaciones densas.
- Headless CMS como fuente principal: descartado para MVP por control limitado del dominio de aprendizaje/progreso.

## Seguimiento
- Revisar este ADR al cerrar Fase 1 para validar rendimiento y complejidad operativa.
