import client from './client'

// API de Almacenamiento. Solo el super admin (todas las fichas) y el instructor (sus fichas) la usan; el servidor
// responde 403 a los demás y 404 a una ficha ajena.

// GET /api/almacenamiento/resumen  ->  { data: { fichas: [...], totales: { documentos, bytes }, base?: { motor, bytes } } }
// `base` solo llega al super admin: el tamaño de la base de datos es de todo el sistema.
export const obtenerResumenAlmacenamiento = () =>
  client.get('/almacenamiento/resumen').then((res) => res.data.data)

// GET /api/almacenamiento/fichas/{id}/documentos?page=&per_page=
//   -> { ficha: {id, codigo, nombre_programa}, data: [...], meta: {...} }
// Cada documento: { id, tipo, titulo, obligatorio, borrable, aspirante, convocatoria, tamano_bytes, creado_at }
export const listaDocumentosFicha = (fichaId, params) =>
  client.get(`/almacenamiento/fichas/${fichaId}/documentos`, { params }).then((res) => res.data)

// POST /api/almacenamiento/documentos/borrar  body { ids }  ->  { data: { borrados: [ids], omitidos: [{id, motivo}] } }
// Los obligatorios y los de otras fichas quedan en `omitidos`; el resto se borra.
export const borrarDocumentos = (ids) =>
  client.post('/almacenamiento/documentos/borrar', { ids }).then((res) => res.data.data)

// GET /api/almacenamiento/fichas/{id}/documentos/ids?q=&tipo=  ->  { data: { ids: [...], total } }
// Los ids de TODOS los documentos que se pueden borrar y cumplen la búsqueda y el tipo (no solo de la página).
export const listaIdsBorrablesFicha = (fichaId, params) =>
  client.get(`/almacenamiento/fichas/${fichaId}/documentos/ids`, { params }).then((res) => res.data.data)
