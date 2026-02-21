# Definition of Done + Quality Gates

## 1) Definition of Done (DoD) para historias
Una historia se considera terminada solo si cumple todo lo siguiente:

### 1.1 Funcionalidad
- Cumple exactamente el criterio de aceptacion pactado.
- Maneja estados `loading`, `empty`, `error` y `success`.
- No rompe flujos existentes (sin regresiones funcionales conocidas).

### 1.2 Responsive y accesibilidad basica
- Funciona en mobile (>=360px), tablet y desktop.
- Navegacion por teclado en componentes principales.
- Contraste y labels minimos en formularios.

### 1.3 Validaciones y permisos
- Validaciones de entrada en cliente/servidor donde aplique.
- Reglas de permiso segun rol definidas y testeadas.
- Mensajes de error claros para usuario y logs para diagnostico.

### 1.4 Calidad tecnica
- Codigo tipado (TypeScript) sin `any` innecesario.
- Sin warnings criticos de lint/build.
- Migraciones y cambios de schema documentados.

### 1.5 Pruebas minimas
- Pruebas unitarias para logica critica.
- Pruebas de integracion en flujos de datos clave.
- Evidencia manual para UX principal cuando no haya automatizacion.

### 1.6 Documentacion
- Actualizacion de docs afectadas (taxonomia, modelo, backlog, ADR si aplica).
- Notas de implementacion en PR (que cambia, riesgos, rollback).

## 2) Quality Gates READY / NOT READY
Una historia pasa a `READY` solo si cada rol marca check positivo. Si un rol bloquea, estado `NOT READY`.

## 2.1 PO Gate
- [ ] Valor de negocio claro.
- [ ] Criterios de aceptacion verificables.
- [ ] Dependencias identificadas.
- [ ] Prioridad Must/Nice definida.

## 2.2 UX Gate
- [ ] Flujo definido para happy path y edge cases.
- [ ] Copys y estados vacios/error definidos.
- [ ] Responsive validado en puntos de quiebre MVP.
- [ ] Accesibilidad basica contemplada.

## 2.3 Tech Gate
- [ ] Diseno tecnico coherente con stack acordado.
- [ ] Impacto de datos/API evaluado.
- [ ] Riesgos tecnicos y plan de mitigacion documentados.
- [ ] Si hay decision de arquitectura, existe ADR.

## 2.4 QA Gate
- [ ] Casos de prueba definidos antes de cerrar historia.
- [ ] Evidencia de ejecucion de pruebas.
- [ ] No hay bugs criticos abiertos.
- [ ] Criterios de aceptacion validados uno a uno.

## 2.5 Security Gate
- [ ] Validacion de entradas y salida segura.
- [ ] Permisos revisados en endpoints/paginas sensibles.
- [ ] No se exponen secretos ni datos personales en logs.
- [ ] Dependencias sin vulnerabilidades criticas conocidas.

## 2.6 Content Gate
- [ ] Terminologia consistente con TAXONOMY.
- [ ] Plantillas respetadas (campos obligatorios completos).
- [ ] Afirmaciones historicas/culturales con Citation.
- [ ] Media con rightsStatus valido.

## 3) Criterio READY de historia (antes de desarrollar)
- [ ] Historia redactada en formato accionable.
- [ ] Criterios de aceptacion medibles.
- [ ] Mock/flujo base disponible (si aplica).
- [ ] Dependencias resueltas o explicitadas.
- [ ] Estimacion T-shirt asignada.

## 4) Criterio DONE de historia (al cerrar)
- [ ] Todos los checks DoD y gates aplicables en verde.
- [ ] PR aprobado y mergeado.
- [ ] Sin tareas ocultas pendientes para usar la funcionalidad.
- [ ] Documentacion y changelog interno actualizados.

## 5) Checklist Release MVP
- [ ] Cobertura minima de contenido MVP (10 estilos).
- [ ] Flujos core operativos: explorar -> aprender -> progreso -> certificado.
- [ ] SEO tecnico base aplicado.
- [ ] Performance base en paginas clave dentro de objetivo definido.
- [ ] Observabilidad basica activa (logs, errores, health checks).
- [ ] Politicas de media y citation aplicadas.
- [ ] Backups y plan de rollback probado.
- [ ] Revisiones PO/UX/Tech/QA/Sec/Content firmadas.
