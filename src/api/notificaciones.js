import client from './client'

// API de las notificaciones (la campana). Cada usuario solo ve y marca las suyas; el servidor responde 404 si un aviso no
// es suyo.

// GET /api/notificaciones?page=&per_page=&estado=  ->  { data: [...], meta: { ..., no_leidas, ocultas } }
// 'estado' filtra en el servidor: todas (por defecto, sin las ocultas) | no_leidas | leidas | ocultas. 'no_leidas' de meta cuenta solo las
// visibles y no depende del filtro.
// Cada ítem: { id, tipo, titulo, mensaje, url, leida, leida_at, oculta, ocultada_at, created_at }
export const listaNotificaciones = (params) =>
  client.get('/notificaciones', { params }).then((res) => res.data)

// POST /api/notificaciones/{id}/leer  ->  { data: {...} } con leida = true
export const marcarNotificacionLeida = (id) =>
  client.post(`/notificaciones/${id}/leer`).then((res) => res.data.data)

// POST /api/notificaciones/leer-todas  ->  { data: { marcadas } }
export const marcarTodasNotificacionesLeidas = () =>
  client.post('/notificaciones/leer-todas').then((res) => res.data.data)

// POST /api/notificaciones/{id}/ocultar  ->  { data } con oculta = true (no cambia la lectura; idempotente)
export const ocultarNotificacion = (id) => client.post(`/notificaciones/${id}/ocultar`).then((res) => res.data.data)

// POST /api/notificaciones/{id}/restaurar  ->  { data } con oculta = false (idempotente)
export const restaurarNotificacion = (id) => client.post(`/notificaciones/${id}/restaurar`).then((res) => res.data.data)
