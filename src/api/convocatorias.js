import client from './client'

// API del módulo de Convocatorias (paso 4b). Contrato real del backend
// (documentos 09, 10 y 11): la ficha se hereda de la sesión, el código lo
// genera el servidor y los estados/clasificación se resuelven por código.

// GET /api/convocatorias?q=&estado=&page=  ->  { data: [...], meta: {...} }
// q busca por nombre, código o cargo; estado recibe el código. El backend
// filtra siempre por el alcance de fichas del usuario.
export const listaConvocatorias = (params) =>
  client.get('/convocatorias', { params }).then((res) => res.data)

// GET /api/convocatorias/{id}  ->  { data: {...} } (todos los campos).
// 404 si está fuera del alcance del usuario.
export const detalleConvocatoria = (id) =>
  client.get(`/convocatorias/${id}`).then((res) => res.data)

// POST /api/convocatorias  ->  201 { data: {...} }  (crea en borrador).
// No se envían ficha_id ni campos reservados (id, codigo, estado, creado_por).
export const crearConvocatoria = (datos) =>
  client.post('/convocatorias', datos).then((res) => res.data)

// PATCH /api/convocatorias/{id}  ->  { data: {...} }
export const actualizarConvocatoria = (id, datos) =>
  client.patch(`/convocatorias/${id}`, datos).then((res) => res.data)

// PATCH /api/convocatorias/{id}/estado  body { estado: 'publicada'|'en_proceso'|'cerrada' }
export const cambiarEstadoConvocatoria = (id, { estado }) =>
  client.patch(`/convocatorias/${id}/estado`, { estado }).then((res) => res.data)

// GET /api/parametros?tema=<codigo>  ->  { data: [ { id, codigo, nombre, es_defecto, es_sistema } ] }
// Con ?tema= devuelve una lista plana; sin ?tema= viene agrupado por tema.
// Solo parámetros activos, en orden.
export const listaParametros = (tema) =>
  client.get('/parametros', { params: { tema } }).then((res) => res.data)
