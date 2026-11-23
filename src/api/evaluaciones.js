import client from './client'

// GET /api/evaluaciones?convocatoria_id=&ficha_id=&search=&page=
//   -> { data: [...], meta: { current_page, last_page, per_page, total, convocatorias, fichas } }
// 'meta.convocatorias' y 'meta.fichas' son las opciones de los filtros: el
// subrol 'evaluador' no tiene 'convocatorias:ver', así que no puede pedir el
// listado completo.
export const listaEvaluaciones = (params) =>
  client.get('/evaluaciones', { params }).then((res) => res.data)

// GET /api/evaluaciones/{postulacionId}
//   -> { data: { id, estado, aspirante, convocatoria, evaluacion } }
export const obtenerEvaluacion = (postulacionId) =>
  client.get(`/evaluaciones/${postulacionId}`).then((res) => res.data)

// PUT /api/evaluaciones/{postulacionId}
//   body { observaciones, estado, criterios: [{ criterio, puntaje, ponderacion }] }
//   Registra o actualiza la evaluación del evaluador autenticado (idempotente).
export const guardarEvaluacion = (postulacionId, datos) =>
  client.put(`/evaluaciones/${postulacionId}`, datos).then((res) => res.data)

// POST /api/evaluaciones/{postulacionId}/correcciones/autorizacion  body { justificacion }
//   Autoriza UNA ronda excepcional de corrección (Instructor en sus fichas, Superadmin en todas). Devuelve el resumen
//   de rondas actualizado: { data: { correccion } }.
export const autorizarReapertura = (postulacionId, justificacion) =>
  client.post(`/evaluaciones/${postulacionId}/correcciones/autorizacion`, { justificacion }).then((res) => res.data)

// GET /api/mis-evaluaciones  -> { data: [...] }  (aspirante: sus evaluaciones)
export const misEvaluaciones = () =>
  client.get('/mis-evaluaciones').then((res) => res.data)
