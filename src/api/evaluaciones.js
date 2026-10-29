import client from './client'

// GET /api/evaluaciones?convocatoria_id=&search=&page=
//   -> { data: [...], meta: { current_page, last_page, per_page, total, convocatorias } }
// 'meta.convocatorias' son las opciones del filtro: el subrol 'evaluador' no
// tiene 'convocatorias:ver', así que no puede pedir el listado completo.
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

// GET /api/mis-evaluaciones  -> { data: [...] }  (aspirante: sus evaluaciones)
export const misEvaluaciones = () =>
  client.get('/mis-evaluaciones').then((res) => res.data)
