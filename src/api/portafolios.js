import client from './client'
import { dispararDescarga } from './postulacionesDocumentos'

// API para el módulo de Portafolios (admin: usuarios:gestionar)
// Usa endpoints de revisión existentes + nuevo /portafolios/{user}
// Solo lectura: el administrador y el instructor ven y descargan, no escriben.

// GET /api/usuarios?role=aspirante&con_postulaciones=1&ficha_id=&search=&page=
export const listaAspirantes = (params = {}) =>
  client.get('/usuarios', {
    params: { role: 'aspirante', con_postulaciones: 1, ...params },
  }).then((res) => res.data)

// GET /api/portafolios/{user}
export const obtenerPortafolio = (userId) =>
  client.get(`/portafolios/${userId}`).then((res) => res.data.data)

// GET /api/revision/postulaciones/{id}/documentos
export const estadoRevision = (postulacionId) =>
  client.get(`/revision/postulaciones/${postulacionId}/documentos`).then((res) => res.data.data)

// Los PDF se abren en una pestaña nueva con ?inline=1 (Content-Disposition:
// inline). Las descargas clásicas siguen siendo GET sin ese parámetro.

// GET /api/revision/postulaciones/{id}/documentos/{documento}/archivo  (descarga)
export const descargarDocumentoRevision = async (postulacionId, documentoId, nombre) => {
  const res = await client.get(
    `/revision/postulaciones/${postulacionId}/documentos/${documentoId}/archivo`,
    { responseType: 'blob' },
  )
  dispararDescarga(res.data, nombre)
}

// GET /api/revision/postulaciones/{id}/skills/{skill}/certificado/archivo  (descarga)
export const descargarCertificadoRevision = async (postulacionId, skillId, nombre) => {
  const res = await client.get(
    `/revision/postulaciones/${postulacionId}/skills/${skillId}/certificado/archivo`,
    { responseType: 'blob' },
  )
  dispararDescarga(res.data, nombre)
}
