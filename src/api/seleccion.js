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
