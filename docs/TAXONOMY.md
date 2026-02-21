# Taxonomia MVP v1

## 1) Objetivo
Definir una taxonomia minima para normalizar contenido, busqueda y aprendizaje en Fase 1.

## 2) Categorias iniciales de estilos
Categorias usadas para clasificar `Style.category`:
- Urbana
- Clasica
- Contemporanea
- Social
- Ritual/Celebrativa
- Folclorica
- Escenica
- Hibrida/Fusion

Reglas:
- Un estilo puede pertenecer a 1 categoria principal y varias secundarias via tags.
- La categoria principal debe representar el uso pedagogico dominante en el MVP.

## 3) Definicion de niveles
### Beginner
El alumno debe poder:
- Ejecutar postura base, pulso y groove fundamental.
- Reproducir 5-8 moves nucleares a tempo lento y medio.
- Mantener conteo simple (8-count o equivalente definido por estilo).
- Identificar 3 errores comunes y corregirlos con feedback guiado.

### Intermediate
El alumno debe poder:
- Encadenar combinaciones de 16-32 counts sin perder timing.
- Controlar dinamicas (suave, acento, stop, release).
- Aplicar variaciones de al menos 5 moves.
- Adaptar ejecucion a 2 rangos de BPM por estilo.

### Advanced
El alumno debe poder:
- Improvisar con coherencia tecnica y musical.
- Cambiar calidades de movimiento con intencion.
- Ensenar fundamentos de manera estructurada.
- Analizar conexiones entre estilos y justificar decisiones de movimiento.

## 4) Tags estandar para Move
Formato recomendado: `dimension:valor` (ejemplo: `body_part:hips`).

### 4.1 Body
- `body_part`: full_body, upper_body, lower_body, torso, hips, feet, arms, head
- `orientation`: front, diagonal_left, diagonal_right, side, back
- `level_change`: low, mid, high, mixed

### 4.2 Dinamica
- `dynamic`: smooth, sharp, bounce, grounded, explosive, sustained
- `energy`: low, medium, high
- `impact`: soft, accented, hard

### 4.3 Groove y musicalidad
- `groove_type`: bounce, rock, pulse, swing, roll, step
- `musical_focus`: beat, offbeat, syncopation, accent, phrase
- `count_system`: count8, count4, clave, free_phrase

### 4.4 Tempo y dificultad
- `bpm_range`: slow(<85), medium(85-110), fast(111-130), very_fast(>130)
- `difficulty`: beginner, intermediate, advanced
- `coordination`: low, medium, high

### 4.5 Familia de movimiento
- `movement_family`: step, groove, isolation, footwork, turn, jump, floorwork, partnerwork, freestyle
- `purpose`: foundation, transition, combo_anchor, performance, battle

### 4.6 Pedagogia y seguridad
- `teaching_goal`: timing, posture, balance, control, expression
- `common_risk`: knees, ankles, lower_back, neck, none
- `requires_warmup`: yes, no

## 5) Lista final congelada de 10 estilos MVP + subestilos
Estado: congelada para inicio de Fase 1 (2026-02-21).
Nota: nombres y relaciones historicas definitivas requieren Citation. Los subestilos marcados como `PLACEHOLDER` necesitan validacion editorial/fuente.

| Style (MVP) | Categoria principal | Substyles sugeridos (3-6) |
|---|---|---|
| Dancehall (estilo modelo) | Urbana | Old School, Middle School, New School, Daggering `PLACEHOLDER`, Female Dancehall `PLACEHOLDER` |
| Hip Hop | Urbana | Old School Hip Hop, Party Dance, Freestyle Hip Hop, Choreo Hip Hop `PLACEHOLDER` |
| House | Urbana | Jacking, Footwork House, Lofting, Soulful House `PLACEHOLDER` |
| Breaking | Urbana | Toprock, Downrock, Power Moves, Freezes, Footwork |
| Salsa | Social | Salsa On1, Salsa On2, Casino/Cuban, Rueda de Casino, Salsa Calena `PLACEHOLDER` |
| Bachata | Social | Bachata Dominicana, Bachata Moderna, Bachata Sensual `PLACEHOLDER`, Bachata Fusion `PLACEHOLDER` |
| Ballet | Clasica/Escenica | Classical Ballet, Neoclassical `PLACEHOLDER`, Contemporary Ballet `PLACEHOLDER` |
| Contemporary Dance | Contemporanea/Escenica | Release Technique `PLACEHOLDER`, Contact Improvisation, Floorwork Contemporary, Lyrical Contemporary `PLACEHOLDER` |
| Afro Dance (pan-african social) | Ritual/Celebrativa/Urbana | Afrobeats Social `PLACEHOLDER`, Azonto `PLACEHOLDER`, Ndombolo `PLACEHOLDER`, Amapiano Social `PLACEHOLDER` |
| Folclorico Latino (bloque inicial) | Folclorica | Cumbia Social `PLACEHOLDER`, Joropo `PLACEHOLDER`, Cueca `PLACEHOLDER`, Bomba `PLACEHOLDER` |

## 6) Convenciones de taxonomia
- `Style.slug` y `Substyle.slug` en kebab-case.
- Un `Substyle` pertenece a un `Style` padre.
- `Move` puede mapear a varios estilos/subestilos con nivel recomendado.
- Si hay conflicto de nomenclatura regional: usar nombre canonico + alias regionales.

## 7) Estado de cierre para Fase 1
- Estilo modelo confirmado: Dancehall.
- Lista de 10 estilos MVP congelada (se revisa de nuevo al cierre de Fase 1).
- Pendiente de evolucion posterior: validacion experta de subestilos `PLACEHOLDER` y glosario de sinonimos.
