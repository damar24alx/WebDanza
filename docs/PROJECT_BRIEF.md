# Project Brief - Plataforma definitiva del mundo de la danza

## 1) Vision del producto
Construir una plataforma que combine enciclopedia estructurada + rutas de aprendizaje practicas para que cualquier persona pueda descubrir estilos, entender su lenguaje tecnico y progresar con evidencia de aprendizaje.

La vision operativa es: "aprender con un clic". Eso significa que desde cualquier pagina (Style, Substyle, Move, Lesson o Course) el usuario siempre puede continuar con el siguiente paso recomendado sin perder contexto. El contenido no debe ser solo descriptivo; debe ser accionable.

Principios de producto:
- Descubrimiento guiado: cada concepto conecta con movimientos, lecciones y cursos.
- Aprendizaje medible: progreso por leccion, dominio por habilidades, hitos y certificados MVP.
- Contenido trazable: afirmaciones historicas o culturales solo con Citation/Source.
- Modelo extensible: preparado para mapa/timeline/grafo visual en Fase 2 sin rehacer base de datos.

Resultado esperado del MVP (Fase 1):
- Un usuario puede explorar 10 estilos iniciales.
- Puede abrir movimientos clave, ver media interna, practicar y registrar progreso.
- Puede completar una ruta inicial y obtener un certificado MVP.

## 2) Publico objetivo
- Principiante motivado: quiere empezar rapido, sin perderse en terminos tecnicos.
- Bailarin intermedio: quiere ordenar tecnica, musicalidad y vocabulario.
- Instructor emergente: necesita material estructurado para planificar clases.
- Curioso cultural: quiere entender conexiones entre estilos sin afirmaciones no verificadas.

## 3) Problema que resuelve
Hoy el aprendizaje de danza digital esta fragmentado:
- Videos sueltos sin secuencia pedagogica.
- Terminologia inconsistente entre escuelas/comunidades.
- Poca trazabilidad de fuentes historicas y contexto cultural.
- Dificultad para medir progreso real.

La plataforma resuelve esto con un modelo de contenido normalizado, rutas de aprendizaje y progreso por competencias.

## 4) Propuesta de valor
### "Aprender con un clic"
- Desde un Style: entrar a subestilos, movimientos base y ruta sugerida.
- Desde un Move: ir a prerrequisitos, errores comunes, variaciones y lecciones que lo usan.
- Desde una Lesson: practicar, registrar progreso y avanzar al siguiente bloque.
- Desde un Course: visualizar avance total y desbloquear certificado MVP.

## 5) Alcance MVP (Fase 1)
En alcance:
- Catalogo inicial de 10 estilos y subestilos base.
- Diccionario de Moves con tags estandar.
- Lessons y Courses iniciales orientados a progresion Beginner -> Intermediate.
- Entidad Media basada en rutas internas de la plataforma (`/media/...`).
- Citas/fuentes obligatorias para afirmaciones historicas o culturales.
- Seguimiento de UserProgress y Certificate MVP.
- SEO tecnico basico, performance base y observabilidad minima.

Fuera de alcance en Fase 1:
- Mapa/timeline/grafo visual interactivo (Fase 2).
- Streaming en vivo propio/CDN avanzado de video.
- Noticias y comunidad.
- Marketplace de instructores.
- Edicion colaborativa abierta al publico.
- Gamificacion avanzada (ligas, ranking global en tiempo real).

## 6) Roadmap Fase 0-4
- Fase 0 (Fundacion): taxonomia, templates, data model v1, DoD, backlog, plan de repo, ADRs.
- Fase 1 (MVP funcional): contenido base, navegacion principal, diccionario de moves, aprendizaje y progreso, certificados MVP, SEO/performance base.
- Fase 2 (Conocimiento expandido): mapa/timeline/grafo visual, conexiones historicas enriquecidas, herramientas editoriales mas robustas.
- Fase 3 (Expansion): modulo de noticias del ecosistema + comunidad.
- Fase 4 (Escalado institucional): streaming propio, convenios y programa de becas.

## 7) Riesgos y mitigaciones
| Riesgo | Impacto | Mitigacion |
|---|---|---|
| Costo de tokens/IA en pipeline editorial | Alto | Limitar IA a asistencia editorial, cachear salidas, cuotas por flujo, revisar ROI mensual. |
| Escala de base de datos y consultas | Medio/Alto | Prisma + Postgres con indices desde MVP, paginacion, monitoreo de queries lentas. |
| Derechos de media (copyright/licencias) | Alto | MVP con media interna y `rightsStatus` obligatorio, metadata de origen y proceso de takedown. |
| Moderacion de contenido | Alto | Flujo editorial con READY/NOT READY, roles y aprobacion previa a publicacion. |
| Inconsistencia terminologica | Medio | Taxonomia y templates obligatorios, glosario, revisiones por Content QA. |
| Deuda tecnica temprana | Medio | PRs pequenos, ADRs por decisiones de arquitectura, Definition of Done estricta. |

## 8) Metricas de exito MVP
### Producto
- Activacion: >= 40% de nuevos usuarios completan su primera Lesson en 24h.
- Retencion semana 1: >= 25%.
- Tiempo a primer valor (TTV): <= 5 minutos desde landing a primera practica.

### Contenido
- Cobertura MVP: 10/10 estilos con minimo 1 course y 8+ moves cada uno.
- Trazabilidad: 100% de afirmaciones historicas/culturales con Citation.
- Calidad editorial: >= 90% de items pasan Quality Gates sin retrabajo mayor.

### Aprendizaje
- Completion rate de cursos MVP: >= 35%.
- Mejora percibida (auto-evaluacion): >= 70% reporta progreso tecnico.
- Certificados emitidos/usuarios activos mensuales: >= 15%.

## 9) Restricciones tecnicas fijadas
- Frontend: Next.js (App Router) + TypeScript + TailwindCSS.
- Backend de datos: PostgreSQL + Prisma.
- Auth: sesion JWT HttpOnly propia en Fase 1 (con opcion de migrar a NextAuth/Auth.js mas adelante).
- Media MVP: rutas internas + entidad `Media` lista para evolucionar a storage/CDN.

## 10) Notas de rigor de contenido
- No registrar "hechos historicos especificos" sin Citation/Source.
- Si se necesita un ejemplo sin fuente verificada: marcar como `PLACEHOLDER`.

## 11) Decisiones cerradas pre-Fase 1 (2026-02-21)
- Idioma base MVP: Espanol neutro.
- Direccion de marca visual: mixto (enciclopedia clara + academia moderna).
- Lista final de 10 estilos MVP: congelada segun `docs/TAXONOMY.md`.
- Estilo modelo del seed MVP: Dancehall.
- Admin en MVP: con roles `Admin`, `Editor`, `Reviewer` (uso interno inicial).
- Base de datos local: Docker (recomendado) como estandar del equipo.
- Certificado MVP: vista web + codigo verificable; PDF se difiere a fase posterior.
- Fuente de videos MVP: solo media interna + politica `rightsStatus` obligatoria.
