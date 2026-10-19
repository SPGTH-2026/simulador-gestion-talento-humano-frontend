import client from './client'

// API del módulo de Postulaciones (Paso 3 del backend, documentos 15-18 y 31).
// "Mis postulaciones" SIEMPRE trae solo las del autenticado, sea cual sea el
// rol; cada fila lleva el resumen embebido de su convocatoria.
//
// Flujo con BORRADOR (doc 31): la postulación NACE en 'borrador'; el aspirante
// completa sexo, documentos, adicionales y skills, y solo el envío la pasa a
// 'postulada'. 'postulada' ya NO se alcanza por el PATCH de estado.

// POST /api/convocatorias/{id}/postulaciones
//   -> 201 { data: {...} }  alta nueva en 'borrador'
//   -> 200 { data: {...} }  retoma el borrador existente o REABRE una 'retirada'
//   -> 422 si ya está 'postulada': "Ya estás postulado en esta convocatoria."
//   404 fuera de alcance / no publicada; 403 si el rol no es aspirante.
// Devuelve la postulación (no el envoltorio { data }).
export const postularse = (convocatoriaId) =>
  client.post(`/convocatorias/${convocatoriaId}/postulaciones`).then((res) => res.data.data)

// GET /api/postulaciones?page=&per_page=  ->  { data: [...], meta: {...} }
// Cada ítem: { id, estado {id,codigo,nombre}, fecha_postulacion, fecha_retiro,
//              convocatoria {id, codigo, nombre, cargo, area, estado, fechas} }
export const listaMisPostulaciones = (params) =>
  client.get('/postulaciones', { params }).then((res) => res.data)

// PATCH /api/postulaciones/{id}/estado  body { estado: 'retirada' | 'borrador' }
//   - 'retirada': descarta un borrador o retira una postulada (exige que la
//     convocatoria siga publicada).
//   - 'borrador': REABRE una retirada (exige la ventana abierta).
//   - 'postulada' -> 422: para enviar se usa enviarPostulacion().
// 404 si la postulación es ajena; 422 si la transición no procede.
export const cambiarEstadoPostulacion = (id, estado) =>
  client.patch(`/postulaciones/${id}/estado`, { estado }).then((res) => res.data.data)

// POST /api/postulaciones/{id}/enviar  (sin cuerpo)  ->  { data: {...} } 'postulada'
// Valida los documentos obligatorios:
//   - 200 con estado 'postulada'.
//   - 422 si faltan obligatorios: { message, errors.documentos[], faltantes[{codigo,nombre,motivo?}] }.
//   - 422 si no está en 'borrador' ("Solo se puede enviar una postulación en borrador.").
//   - 404 si es ajena/inexistente.
export const enviarPostulacion = (id) =>
  client.post(`/postulaciones/${id}/enviar`).then((res) => res.data.data)
