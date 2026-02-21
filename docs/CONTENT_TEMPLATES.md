# Content Templates v1

## 1) Objetivo
Estandarizar la creacion de contenido para consistencia pedagogica, trazabilidad y reutilizacion en producto.

## 2) Reglas editoriales globales
- Tono: claro, tecnico y accionable. Evitar adjetivos vacios.
- Nombres: usar termino canonico + alias en campo dedicado.
- Consistencia: una sola definicion por concepto; evitar duplicados semanticos.
- Historia/cultura: toda afirmacion especifica requiere `Citation`.
- Sin fuente verificable: marcar `PLACEHOLDER`.
- Instrucciones tecnicas: escribir en pasos observables y medibles.
- Idioma base MVP: Espanol neutro (cerrado para Fase 1).

## 3) Como citar fuentes
Formato minimo por cita:
- `sourceType`: book, paper, interview, article, archive, video, other
- `title`
- `author`
- `year` (si aplica)
- `url` (si aplica)
- `accessedAt`
- `claimScope`: que afirmacion respalda

Regla:
- No publicar contenido historico/cultural sin al menos 1 Citation activa.

## 4) Plantilla Style
## 4.1 Campos obligatorios
| Campo | Tipo | Regla |
|---|---|---|
| name | string | Unico por idioma base |
| slug | string | kebab-case, unico global |
| categoryPrimary | enum | Debe existir en TAXONOMY |
| summary | text corto | 120-320 caracteres |
| historicalCulturalContext | markdown | Por que, donde y para que (con Citation para publicar) |
| levelEntry | enum | beginner/intermediate |
| pedagogyOverview | markdown | Como se aprende este estilo |
| movementPrinciples | markdown | Principios tecnicos base |
| musicalityBasics | markdown | Conteo, pulso, acentos |
| vocabularyCore | string[] | 8-20 terminos base con definicion corta |
| moveDictionaryRefs[] | relation | Moves esenciales del estilo |
| safetyNotes | markdown | Riesgos y calentamiento |
| publishedStatus | enum | draft/review/ready/published |

## 4.2 Campos opcionales
- aliases[]
- categorySecondary[]
- originNotes `PLACEHOLDER` + Citation
- keyArtists `PLACEHOLDER` + Citation
- prerequisiteStyles[]
- relatedStyles[]
- heroMediaId

## 4.3 Secciones recomendadas pagina Style
- Resumen rapido
- Para quien es este estilo
- Fundamentos tecnicos
- Musicalidad y conteo
- Vocabulario esencial
- Moves esenciales
- Ruta sugerida (Lessons/Course)
- Conexiones con otros estilos
- Fuentes y notas

## 5) Plantilla Substyle
## 5.1 Campos obligatorios
| Campo | Tipo | Regla |
|---|---|---|
| styleId | relation | Debe existir Style padre |
| name | string | Unico dentro del estilo padre |
| slug | string | unico global |
| summary | text corto | Diferencia clara vs estilo padre |
| historicalCulturalContext | markdown | Contexto del subestilo (con Citation para publicar) |
| technicalFocus | markdown | Enfasis tecnico principal |
| musicalFocus | markdown | Enfasis ritmico/musical |
| vocabularyFocus | string[] | 5-12 terminos distintivos |
| levelRange | enum[] | beginner/intermediate/advanced |
| publishedStatus | enum | draft/review/ready/published |

## 5.2 Campos opcionales
- aliases[]
- historicalNotes `PLACEHOLDER` + Citation
- contextOfUse (social, stage, battle, ritual)
- recommendedMoves[]
- representativeMedia[]

## 6) Plantilla Move/Step
## 6.1 Campos obligatorios
| Campo | Tipo | Regla |
|---|---|---|
| name | string | Termino canonico |
| slug | string | unico global |
| summary | text corto | Que es y para que sirve |
| moveType | enum | foundation/variation/transition/combo |
| difficulty | enum | beginner/intermediate/advanced |
| bodyMechanics | markdown | Biomecanica esencial |
| stepByStep | markdown | Pasos numerados observables |
| commonMistakes | markdown | Minimo 3 errores |
| corrections | markdown | Correccion asociada por error |
| tags[] | string | Usar taxonomia estandar |
| safetyNotes | markdown | Riesgos y contraindicaciones |
| publishedStatus | enum | draft/review/ready/published |

## 6.2 Campos opcionales
- aliases[]
- prerequisites[] (Move IDs)
- regressions[] (version mas simple)
- progressions[] (version mas compleja)
- styleLinks[]
- substyleLinks[]
- musicConceptLinks[]
- techniqueConceptLinks[]
- mediaLinks[]

## 6.3 Secciones recomendadas pagina Move
- Definicion corta
- Cuando usarlo
- Prerrequisitos
- Tecnica paso a paso
- Errores comunes y correcciones
- Variaciones por nivel
- Relacion musical (conteo/BPM/acento)
- Lecciones y cursos donde aparece
- Fuentes y notas

## 7) Plantilla Lesson
## 7.1 Campos obligatorios
| Campo | Tipo | Regla |
|---|---|---|
| title | string | claro y orientado a resultado |
| slug | string | unico global |
| objective | text corto | resultado medible al finalizar |
| level | enum | beginner/intermediate/advanced |
| durationMin | int | estimado realista |
| lessonType | enum | technique, combo, musicality, conditioning |
| warmupPlan | markdown | obligatorio si hay riesgo fisico |
| steps | markdown | flujo instruccional secuencial |
| successCriteria | markdown | verificable por alumno/instructor |
| moveRefs[] | relation | al menos 1 Move |
| publishedStatus | enum | draft/review/ready/published |

## 7.2 Campos opcionales
- assessmentType (checklist/self-review/video-review)
- requiredEquipment[]
- cooldownPlan
- homework
- mediaPlaylist[]
- citationRefs[]

## 8) Plantilla Course/Path
## 8.1 Campos obligatorios
| Campo | Tipo | Regla |
|---|---|---|
| title | string | orientado a meta de aprendizaje |
| slug | string | unico global |
| summary | text corto | promesa concreta |
| targetLevel | enum | beginner/intermediate/advanced |
| learningOutcomes | markdown | 3-8 resultados medibles |
| lessonSequence[] | relation | orden explicito de Lessons |
| completionRule | markdown | criterio para completado |
| certificateEligible | boolean | true/false |
| publishedStatus | enum | draft/review/ready/published |

## 8.2 Campos opcionales
- styleFocus[]
- substyleFocus[]
- estimatedHours
- prerequisiteCourses[]
- capstoneLessonId
- heroMediaId

## 9) Guia de redaccion tecnica (paso a paso)
Usar este patron en `Move.stepByStep` y `Lesson.steps`:
1. Posicion inicial: postura, apoyo, orientacion, conteo de entrada.
2. Accion principal: que parte del cuerpo inicia y cual sigue.
3. Timing: conteo exacto o referencia ritmica.
4. Control: checkpoints de ejecucion correcta.
5. Error comun asociado: como detectarlo rapido.
6. Correccion inmediata: cue corto de correccion.

Reglas:
- Cada paso debe iniciar con verbo de accion.
- Evitar terminos ambiguos como "hazlo con flow" sin criterio observable.
- Incluir variante `Beginner` cuando el movimiento sea de riesgo medio/alto.

## 10) Checklist de publicacion por contenido
- Slug unico validado.
- Campos obligatorios completos.
- Citas incluidas cuando aplique.
- Tags normalizados.
- Media funcional (link valido).
- Estado en `ready` antes de `published`.
