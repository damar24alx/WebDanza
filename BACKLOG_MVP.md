# Backlog MVP - Plataforma de Danza

## Convenciones
- Prioridad: `Must` o `Nice to have`.
- Estimacion: `S`, `M`, `L`.
- Dependencias: IDs de historias previas.

## EPICA 1: Base UI + navegacion

### E1-S1 - Arquitectura de navegacion principal
- Prioridad: Must
- Estimacion: M
- Descripcion: Definir app shell y menu principal (Styles, Moves, Lessons, Courses, Progress).
- Criterios de aceptacion:
- Existe especificacion de rutas MVP y jerarquia de navegacion documentada.
- El usuario puede llegar a cualquier seccion core en maximo 2 clics.
- Incluye estados de menu en mobile y desktop.
- Dependencias: Ninguna.

### E1-S2 - Listado de estilos con filtros base
- Prioridad: Must
- Estimacion: M
- Descripcion: Crear vista de exploracion de estilos con filtros por categoria y nivel.
- Criterios de aceptacion:
- Se muestran solo estilos `published`.
- Filtros por categoria y nivel funcionan combinados.
- Estado vacio muestra mensaje de sin resultados.
- Dependencias: E1-S1, E2-S4.

### E1-S3 - Pagina de detalle de Style
- Prioridad: Must
- Estimacion: L
- Descripcion: Construir pagina de Style con secciones estandar y enlaces a Moves/Lessons/Courses.
- Criterios de aceptacion:
- La pagina renderiza resumen, fundamentos, musicalidad, moves esenciales y rutas sugeridas.
- Links a contenido relacionado son navegables y validos.
- Si faltan fuentes historicas, muestra bloque `PLACEHOLDER` no publicable.
- Dependencias: E1-S1, E2-S4, E3-S2.

### E1-S4 - Busqueda global MVP
- Prioridad: Must
- Estimacion: M
- Estado: DONE (2026-02-23)
- Descripcion: Implementar busqueda por nombre/slug para Style, Move, Lesson y Course.
- Criterios de aceptacion:
- Busqueda devuelve resultados agrupados por entidad.
- Soporta coincidencia parcial por nombre.
- Respuesta <500ms en dataset MVP local.
- Dependencias: E2-S4, E3-S1, E4-S2.

### E1-S5 - Accesibilidad y responsive base de navegacion
- Prioridad: Nice to have
- Estimacion: M
- Descripcion: Endurecer navegacion para teclado, focus visible y breakpoints minimos.
- Criterios de aceptacion:
- Flujo principal navegable sin mouse.
- Focus visible en controles interactivos.
- Layout sin desbordes en 360px, 768px, 1280px.
- Dependencias: E1-S1, E1-S2, E1-S3.

## EPICA 2: Modelo de contenido + admin minimo

### E2-S1 - Prisma schema v1 (core)
- Prioridad: Must
- Estimacion: L
- Descripcion: Implementar schema Prisma para entidades core definidas en `docs/DATA_MODEL.md`.
- Criterios de aceptacion:
- Entidades minimas existen con slugs unicos y timestamps.
- Relaciones many-to-many usan tablas intermedias declaradas.
- `prisma validate` pasa sin errores.
- Dependencias: docs/DATA_MODEL.md aprobado.

### E2-S2 - Migraciones iniciales Postgres
- Prioridad: Must
- Estimacion: M
- Descripcion: Crear y aplicar migraciones iniciales para esquema v1.
- Criterios de aceptacion:
- Migracion ejecuta en entorno local limpio.
- Rollback controlado documentado.
- Indices de slug y relaciones principales creados.
- Dependencias: E2-S1.

### E2-S3 - Seed MVP inicial (Dancehall + placeholders)
- Prioridad: Must
- Estimacion: M
- Descripcion: Cargar datos semilla minimos de estilo modelo y estructuras base.
- Criterios de aceptacion:
- Seed crea 1 Style (Dancehall), 3+ Substyles `PLACEHOLDER`, 8 Moves base.
- Datos marcados sin fuente quedan en estado `draft`.
- Seed es idempotente.
- Dependencias: E2-S2.

### E2-S4 - Admin CRUD minimo (Style/Substyle/Move)
- Prioridad: Must
- Estimacion: L
- Descripcion: Crear panel interno minimo para altas, ediciones y cambios de estado editorial.
- Criterios de aceptacion:
- Se puede crear/editar/borrar logico Style/Substyle/Move.
- Validaciones de campos obligatorios bloquean guardado incompleto.
- Estado editorial soporta draft/review/ready/published.
- Permisos por rol activos para `Admin`, `Editor`, `Reviewer`.
- Dependencias: E2-S2.

### E2-S5 - Guardrails editoriales (citations y placeholders)
- Prioridad: Must
- Estimacion: M
- Descripcion: Aplicar reglas para no publicar afirmaciones historicas sin Citation.
- Criterios de aceptacion:
- Publicacion falla si existen claims historicos sin CitationLink.
- Contenido con `PLACEHOLDER` solo puede quedar en draft/review.
- Mensaje de validacion explica accion requerida.
- Dependencias: E2-S4, E3-S4.

## EPICA 3: Diccionario de pasos + media

### E3-S1 - Listado de Moves con tags
- Prioridad: Must
- Estimacion: M
- Descripcion: Construir diccionario navegable de moves con filtros por dificultad, familia y BPM.
- Criterios de aceptacion:
- Filtros usan taxonomia definida en `docs/TAXONOMY.md`.
- Listado muestra nombre, dificultad y tags clave.
- Estado vacio y error implementados.
- Dependencias: E2-S4.

### E3-S2 - Detalle de Move (tecnica paso a paso)
- Prioridad: Must
- Estimacion: L
- Descripcion: Mostrar pagina de Move con tecnica, errores comunes y variaciones.
- Criterios de aceptacion:
- Seccion "paso a paso" renderiza pasos numerados.
- Errores y correcciones estan enlazados 1:1.
- Muestra moves prerrequisito y progresiones si existen.
- Dependencias: E3-S1, E2-S4.

### E3-S3 - Integracion Media interna
- Prioridad: Must
- Estimacion: M
- Descripcion: Asociar Media interna (`/media/...`) a Moves/Lessons/Courses.
- Criterios de aceptacion:
- Solo acepta rutas internas validas bajo `/media/...`.
- Si link esta bloqueado, UI muestra fallback y motivo.
- Metadata minima de media queda persistida.
- `rightsStatus` obligatorio con valores permitidos: unknown, ok_to_embed, restricted, blocked.
- Dependencias: E2-S1, E2-S4.

### E3-S4 - Gestion de Citation y Source
- Prioridad: Must
- Estimacion: M
- Estado: DONE (2026-02-23)
- Descripcion: Permitir crear citas y vincularlas a entidades de contenido.
- Criterios de aceptacion:
- Formulario exige campos minimos de Citation.
- Se puede enlazar Citation a Style/Substyle/Move/Lesson/Course/Connection.
- Vista de detalle muestra lista de fuentes activas.
- Dependencias: E2-S4.

### E3-S5 - Relacion de moves por familia y uso
- Prioridad: Nice to have
- Estimacion: S
- Descripcion: Mostrar seccion "Relacionados" por familia de movimiento y objetivo pedagogico.
- Criterios de aceptacion:
- Cada Move muestra hasta 6 relacionados ordenados por relevancia.
- Algoritmo inicial usa tags compartidos y dificultad.
- Si no hay relacionados, mostrar mensaje explicito.
- Dependencias: E3-S1, E3-S2.

## EPICA 4: Aprendizaje + progreso

### E4-S1 - Vista de Lesson con objetivo y checklist
- Prioridad: Must
- Estimacion: M
- Estado: DONE (2026-02-23)
- Descripcion: Implementar pagina de Lesson con objetivo, pasos, moves vinculados y checklist de logro.
- Criterios de aceptacion:
- Se muestra objetivo medible y criterios de exito.
- Usuario puede marcar checklist por paso completado.
- Estado se conserva al recargar.
- Dependencias: E2-S4, E3-S2.

### E4-S2 - Ruta de Course secuenciada
- Prioridad: Must
- Estimacion: M
- Estado: DONE (2026-02-23)
- Descripcion: Presentar lessons en orden y bloquear avance si no cumple regla minima definida.
- Criterios de aceptacion:
- Orden de lessons respeta `CourseLesson.orderIndex`.
- Boton "siguiente" habilita solo cuando se cumple regla de completitud.
- Se muestra progreso porcentual del curso.
- Dependencias: E4-S1, E2-S1.

### E4-S3 - Persistencia de UserProgress
- Prioridad: Must
- Estimacion: M
- Estado: DONE (2026-02-23)
- Descripcion: Registrar avance por lesson y course por usuario autenticado.
- Criterios de aceptacion:
- UserProgress se crea/actualiza al completar checklist.
- Percent nunca excede 100 ni baja sin evento explicito.
- Consulta de progreso responde por usuario y curso.
- Dependencias: E2-S1, E4-S1, Auth Fase 1.

### E4-S4 - Continuar donde quedaste
- Prioridad: Must
- Estimacion: S
- Estado: DONE (2026-02-23)
- Descripcion: Mostrar CTA para reanudar ultima lesson/course incompleto.
- Criterios de aceptacion:
- Home de usuario muestra ultimo progreso `in_progress`.
- CTA abre lesson exacta pendiente.
- Si no hay progreso, muestra estado vacio guiado.
- Dependencias: E4-S3.

### E4-S5 - Tablero simple de progreso personal
- Prioridad: Nice to have
- Estimacion: M
- Estado: DONE (2026-02-23)
- Descripcion: Agregar vista resumida por estilo, curso y nivel alcanzado.
- Criterios de aceptacion:
- Muestra cursos completados y en curso.
- Muestra porcentaje por estilo con base en lessons completadas.
- Datos coinciden con registros de UserProgress.
- Dependencias: E4-S3, E1-S1.

## EPICA 5: Certificados + logros (MVP)

### E5-S1 - Regla de elegibilidad a certificado
- Prioridad: Must
- Estimacion: S
- Estado: DONE (2026-02-23)
- Descripcion: Definir y aplicar regla MVP para emitir certificado por curso segun `completionRule`.
- Criterios de aceptacion:
- Si `completionRule=all_lessons`, certificado se habilita con 100%.
- Si `completionRule=percent_90`, certificado se habilita con >=90%.
- Curso debe tener `certificateEligible=true`.
- Regla documentada en codigo y docs.
- Dependencias: E4-S2, E4-S3.

### E5-S2 - Emision de Certificate con codigo unico
- Prioridad: Must
- Estimacion: M
- Estado: DONE (2026-02-23)
- Descripcion: Crear registro de certificado y codigo verificable.
- Criterios de aceptacion:
- `certificateCode` unico generado automaticamente.
- Se persiste `issuedAt` al emitir.
- No se duplica certificado para mismo usuario+curso.
- Dependencias: E5-S1, E2-S1.

### E5-S3 - Vista de certificado MVP
- Prioridad: Must
- Estimacion: M
- Estado: DONE (2026-02-23)
- Descripcion: Mostrar pagina de certificado con datos minimos del logro.
- Criterios de aceptacion:
- La pagina muestra usuario, curso, fecha y codigo.
- URL de verificacion permite consultar validez.
- Si codigo invalido, respuesta clara.
- En MVP no se genera PDF; solo vista web verificable.
- Dependencias: E5-S2, E1-S1.

### E5-S4 - Logros MVP (badges basicos)
- Prioridad: Nice to have
- Estimacion: M
- Estado: DONE (2026-02-23)
- Descripcion: Anadir badges por hitos iniciales (primer lesson, primer curso, constancia).
- Criterios de aceptacion:
- Badges se otorgan por reglas deterministicas.
- Usuario puede ver lista de badges desbloqueados.
- Reglas estan documentadas y testeadas.
- Dependencias: E4-S3.

### E5-S5 - Reemision/revocacion admin de certificado
- Prioridad: Nice to have
- Estimacion: S
- Estado: DONE (2026-02-23)
- Descripcion: Permitir al admin reemitir o revocar certificados por incidencia.
- Criterios de aceptacion:
- Admin puede cambiar estado activo/revocado.
- Historial minimo de evento guardado.
- Verificador publico refleja estado actualizado.
- Dependencias: E2-S4, E5-S2.

## EPICA 6: SEO + performance + observabilidad basica

### E6-S1 - Metadatos SEO por entidad
- Prioridad: Must
- Estimacion: M
- Estado: DONE (2026-02-23)
- Descripcion: Generar title/description/canonical para Style, Move, Lesson y Course.
- Criterios de aceptacion:
- Cada pagina publicada tiene metadatos no vacios.
- Canonical apunta a slug oficial.
- OpenGraph basico presente en paginas clave.
- Dependencias: E1-S3, E3-S2, E4-S1, E4-S2.

### E6-S2 - Sitemap y robots MVP
- Prioridad: Must
- Estimacion: S
- Estado: DONE (2026-02-23)
- Descripcion: Exponer sitemap dinamico y robots segun entorno.
- Criterios de aceptacion:
- Sitemap incluye solo contenido `published`.
- Robots bloquea rutas internas de admin.
- Validacion manual en entorno staging.
- Dependencias: E6-S1.

### E6-S3 - Presupuesto de performance base
- Prioridad: Must
- Estimacion: M
- Estado: DONE (2026-02-23)
- Descripcion: Definir y vigilar presupuesto inicial de carga en paginas core.
- Criterios de aceptacion:
- Presupuesto documentado (LCP, TTFB, JS size).
- Paginas core cumplen objetivo en entorno de referencia.
- Se registran optimizaciones aplicadas.
- Dependencias: E1-S2, E1-S3, E3-S2.

### E6-S4 - Observabilidad minima (logs + errores)
- Prioridad: Must
- Estimacion: M
- Estado: DONE (2026-02-23)
- Descripcion: Implementar logging estructurado y captura de errores en flujos core.
- Criterios de aceptacion:
- Errores criticos quedan trazables con contexto minimo.
- Endpoint de health check disponible.
- Dashboard basico o salida centralizada documentada.
- Dependencias: E2-S2, E1-S1.

### E6-S5 - KPIs MVP en panel simple
- Prioridad: Nice to have
- Estimacion: S
- Estado: DONE (2026-02-23)
- Descripcion: Exponer metricas iniciales de activacion, retencion y completion.
- Criterios de aceptacion:
- Panel muestra 3 KPIs definidos en Project Brief.
- Datos se refrescan diariamente.
- Fuente de calculo documentada.
- Dependencias: E4-S3, E6-S4.

## WORKSTREAM 1A.1: Hardening de UI post-cierre 1A (no bloquea 1B)

Contexto:
- Fase 1A se cierra funcionalmente segun `docs/PHASE1A_CLOSEOUT.md`.
- Este workstream mantiene trazabilidad de pendientes visuales/tecnicos de frontend sin bloquear DB/Prisma.

### E1A-S1 - Paridad visual fina vs Stitch en rutas core
- Prioridad: Nice to have
- Estimacion: M
- Descripcion: Ajustar spacing, jerarquia visual y microdetalles para acercar cada pantalla core a su `screen.png`.
- Criterios de aceptacion:
- Revision por ruta (`/`, `/styles`, `/moves`, `/learn`, `/pricing`, `/admin`, auth) con checklist visual completado.
- No hay cambios de comportamiento funcional en filtros, estados ni navegacion.
- Evidencia visual antes/despues documentada.
- Dependencias: Cierre funcional de Fase 1A.

### E1A-S2 - Consolidacion de componentes de estado
- Prioridad: Nice to have
- Estimacion: S
- Descripcion: Unificar `web/src/components/state` y `web/src/components/states` para evitar duplicidad.
- Criterios de aceptacion:
- Existe una sola fuente de verdad para componentes de estado.
- Imports y rutas quedan consistentes en `web/src/app`.
- Lint/build/smoke permanecen en verde.
- Dependencias: E1A-S1.

### E1A-S3 - Pruebas UI adicionales de estados
- Prioridad: Nice to have
- Estimacion: M
- Descripcion: Expandir pruebas automatizadas para validar estados `loading`, `empty`, `error`, `locked` en rutas core.
- Criterios de aceptacion:
- Suite automatizada adicional cubre al menos rutas de listados y player.
- Se documenta alcance de cobertura y limites.
- CI/local reportan resultados reproducibles.
- Dependencias: E1A-S2.

### E1A-S4 - Implementacion de rutas Future de Stitch
- Prioridad: Nice to have
- Estimacion: M
- Descripcion: Implementar rutas `Future` de `design/ROUTING_MAP.md` sin mezclar con cambios de datos.
- Criterios de aceptacion:
- Existen rutas `/maps/lineage`, `/maps/steps`, `/me/achievements`.
- Se define componente reusable para `advanced_dance_video_controls` (placeholder funcional).
- Navegacion interna no introduce enlaces rotos.
- Dependencias: E1A-S1.

## Orden sugerido de ejecucion (alto nivel)
1. E2-S1 -> E2-S2 -> E2-S4 -> E3-S1/E3-S2 -> E4-S1/E4-S2 -> E4-S3 -> E5-S1/E5-S2.
2. En paralelo controlado: E1-S1/E1-S2 + E6-S1/E6-S2.
3. Nice to have solo despues de cerrar Must criticos.

## EPICA 7: Go-Live y endurecimiento operacional

### E7-S1 - Checklist de produccion trazable
- Prioridad: Must
- Estimacion: S
- Estado: DONE (2026-02-23)
- Descripcion: consolidar checklist de salida con evidencia por item.
- Criterios de aceptacion:
- Existe archivo unico de checklist con estado `DONE/PARTIAL/BLOCKED`.
- Cada item referencia evidencia tecnica real en repo.
- Dependencias: E6-S4.

### E7-S2 - Runbook operativo (arranque, migraciones, rollback, health)
- Prioridad: Must
- Estimacion: S
- Estado: DONE (2026-02-23)
- Descripcion: documentar operacion minima para despliegue y soporte.
- Criterios de aceptacion:
- Incluye comandos de arranque y migracion.
- Incluye estrategia de rollback basica y health checks.
- Dependencias: E2-S2, E6-S4.

### E7-S3 - Hardening de integridad de base de datos
- Prioridad: Must
- Estimacion: M
- Estado: DONE (2026-02-23)
- Descripcion: agregar controles y scripts de auditoria/reparacion para consistencia de datos.
- Criterios de aceptacion:
- Existen scripts audit/repair ejecutables.
- Se agregan constraints de integridad adicionales en migracion.
- Dependencias: E2-S1, E2-S2.

### E7-S4 - Pipeline CI de gates de produccion
- Prioridad: Must
- Estimacion: M
- Estado: DONE (2026-02-23)
- Descripcion: ejecutar gates tecnicos en CI para push/PR.
- Criterios de aceptacion:
- Workflow corre lint, typecheck, build, integration y smoke.
- Incluye servicios de DB y Redis para pruebas.
- Dependencias: E6-S4.

### E7-S5 - Cierre de pendientes externos de infraestructura
- Prioridad: Must
- Estimacion: M
- Estado: DONE (2026-02-23)
- Descripcion: completar secretos gestionados, observabilidad central y simulacro backup/restore.
- Criterios de aceptacion:
- Secretos en secret manager con rotacion definida.
- Logs/metricas centralizados con alertas basicas.
- Restore probado en staging.
- Dependencias: E7-S1, E7-S2.
