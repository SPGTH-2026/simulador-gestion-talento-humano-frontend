import client from './client'

// Módulo de Selección. Todas las rutas viven bajo /seleccion y el backend decide
// el alcance (fichas del usuario) y los permisos: el frontend solo los refleja.

// GET /api/seleccion/convocatorias?page=
//   -> { data: [{ id, codigo, nombre, cargo, estado: { codigo, nombre }, vacantes }],
//        meta: { current_page, last_page, per_page, total } }
// 'codigo' llega en null para quien no gestiona convocatorias (p. ej. el
// seleccionador): se identifica por 'nombre'. Sin borradores.
export const listaConvocatoriasSeleccion = (params) =>
  client.get('/seleccion/convocatorias', { params }).then((res) => res.data)

// GET /api/seleccion/convocatorias/{id}/candidatos?page=
//   -> { data: [{ id, aspirante, estado_documental, cumplimiento }], meta: {...} }
// estado_documental: pendiente | habilitado | no_habilitado | requiere_revision.
// cumplimiento: entero 0-100 o null (null = sin dato; 0 es un porcentaje válido).
export const candidatosConvocatoria = (convocatoriaId, params) =>
  client.get(`/seleccion/convocatorias/${convocatoriaId}/candidatos`, { params }).then((res) => res.data)

// GET /api/seleccion/convocatorias/{id}/configuracion
//   -> { data: { convocatoria_id, estado_convocatoria, editable, configurada, bloqueada,
//        opcion, entrevista: { activa, peso }, prueba_tecnica: { activa, peso },
//        actualizada_por, actualizada_en } }
// opcion: null (pendiente de configurar) | sin_actividades | solo_entrevista |
//         solo_prueba_tecnica | ambas.
export const obtenerConfiguracion = (convocatoriaId) =>
  client.get(`/seleccion/convocatorias/${convocatoriaId}/configuracion`).then((res) => res.data)

// PUT /api/seleccion/convocatorias/{id}/configuracion
//   body { entrevista_activa, prueba_tecnica_activa, peso_entrevista?, peso_prueba_tecnica? }
//   Devuelve la configuración guardada (mismo formato del GET). 422 con
//   errores por campo si los pesos no son válidos o la convocatoria no admite cambios.
export const guardarConfiguracion = (convocatoriaId, datos) =>
  client.put(`/seleccion/convocatorias/${convocatoriaId}/configuracion`, datos).then((res) => res.data)

// GET /api/seleccion/convocatorias/{c}/candidatos/{p}/referencia-documental
//   -> { data: { postulacion_id, aspirante, estado_documental, cumplimiento,
//        evaluaciones: [{ id, evaluador, cumplimiento, resultado, actualizada_en }],
//        referencia: null | { id, evaluacion_id, evaluador, cumplimiento, resultado,
//          justificacion, designada_por, designada_en, vigente } } }
// Solo Instructor y Superadministrador (el backend responde 403 al resto).
export const obtenerReferencia = (convocatoriaId, postulacionId) =>
  client
    .get(`/seleccion/convocatorias/${convocatoriaId}/candidatos/${postulacionId}/referencia-documental`)
    .then((res) => res.data)

// POST (mismo recurso) body { evaluacion_id, justificacion }. 201 con el mismo formato del GET;
// 422 por campo (justificacion, evaluacion_id, postulacion).
export const designarReferencia = (convocatoriaId, postulacionId, datos) =>
  client
    .post(`/seleccion/convocatorias/${convocatoriaId}/candidatos/${postulacionId}/referencia-documental`, datos)
    .then((res) => res.data)

// GET /api/seleccion/convocatorias/{c}/candidatos/{p}/calificaciones
//   -> { data: { postulacion_id, aspirante, estado_documental, calificable,
//        configuracion: { configurada, bloqueada }, estado_convocatoria,
//        actividades: { entrevista|prueba_tecnica: { activa, peso, estado: desactivada|pendiente|registrada,
//          calificacion: null | { nota, fecha_realizacion, observacion, registrada_por, registrada_en,
//            actualizada_en, correcciones: [{ nota_anterior, nota_nueva, fecha_anterior, fecha_nueva,
//              observacion_anterior, observacion_nueva, motivo, corregida_por, corregida_en }] } } },
//        progreso: { requeridas, registradas, pendientes, completo },
//        resultado_adicional: { estado: pendiente_de_configurar|sin_actividades|incompleto|completo, valor } } }
// Las notas viajan como texto con dos decimales ("8.50").
export const obtenerCalificaciones = (convocatoriaId, postulacionId) =>
  client
    .get(`/seleccion/convocatorias/${convocatoriaId}/candidatos/${postulacionId}/calificaciones`)
    .then((res) => res.data)

// PUT .../calificaciones/{entrevista|prueba_tecnica} body { nota, fecha_realizacion (AAAA-MM-DD),
//   observacion?, motivo? }. 201 si crea y 200 si corrige o reenvía igual; devuelve el mismo formato
//   del GET. Corregir una nota registrada exige 'motivo'. 422 por campo.
export const guardarCalificacion = (convocatoriaId, postulacionId, actividad, datos) =>
  client
    .put(`/seleccion/convocatorias/${convocatoriaId}/candidatos/${postulacionId}/calificaciones/${actividad}`, datos)
    .then((res) => res.data)
