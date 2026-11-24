import client from './client'

// API de las notificaciones (la campana). Cada usuario solo ve y marca las suyas; el servidor responde 404 si un aviso no
// es suyo.

// GET /api/notificaciones?page=&per_page=  ->  { data: [...], meta: { ..., no_leidas } }
// Cada ítem: { id, tipo, titulo, mensaje, url, leida, leida_at, created_at }
export const listaNotificaciones = (params) =>
  client.get('/notificaciones', { params }).then((res) => res.data)

// POST /api/notificaciones/{id}/leer  ->  { data: {...} } con leida = true
export const marcarNotificacionLeida = (id) =>
  client.post(`/notificaciones/${id}/leer`).then((res) => res.data.data)

// POST /api/notificaciones/leer-todas  ->  { data: { marcadas } }
export const marcarTodasNotificacionesLeidas = () =>
  client.post('/notificaciones/leer-todas').then((res) => res.data.data)
