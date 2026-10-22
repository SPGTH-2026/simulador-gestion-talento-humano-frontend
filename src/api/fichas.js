import client from './client'

// GET /api/fichas  ->  { data: [ { id, codigo, nombre_programa, estado, ... } ] }
// Solo las fichas del alcance del usuario: las asignadas por el super admin y
// las que el propio usuario registró (de ahí queda como dueño).
export const listaFichas = () => client.get('/fichas').then((res) => res.data)

// POST /api/fichas
// body { codigo, nombre_programa, estado }  ->  { data: {...} }
// Quien la registra queda como dueño de la ficha.
export const crearFicha = (datos) => client.post('/fichas', datos).then((res) => res.data)

// PATCH /api/fichas/{id}  body { codigo, nombre_programa, estado }
export const actualizarFicha = (id, datos) =>
  client.patch(`/fichas/${id}`, datos).then((res) => res.data)

// DELETE /api/fichas/{id}  ->  { data: { id, eliminada: true } }
// El backend responde 422 si la ficha tiene convocatorias o personas.
export const eliminarFicha = (id) => client.delete(`/fichas/${id}`).then((res) => res.data)

// POST /api/fichas/{id}/instructores  body { usuario_id }  (solo super admin)
export const asignarInstructor = (id, usuarioId) =>
  client.post(`/fichas/${id}/instructores`, { usuario_id: usuarioId }).then((res) => res.data)

// DELETE /api/fichas/{id}/instructores  body { usuario_id }  (solo super admin)
export const quitarInstructor = (id, usuarioId) =>
  client
    .delete(`/fichas/${id}/instructores`, { data: { usuario_id: usuarioId } })
    .then((res) => res.data)
