import client from './client'
import { dispararDescarga, mensajeErrorBlob } from './postulacionesDocumentos'

// API para el módulo de Portafolios (admin: usuarios:gestionar)
// Usa endpoints de revisión existentes + nuevo /portafolios/{user}

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

// Descargas en modo revisión (admin)
export async function descargarDocumentoRevision(postulacionId, documentoId, nombre) {
  const res = await client.get(
    `/revision/postulaciones/${postulacionId}/documentos/${documentoId}/archivo`,
    { responseType: 'blob' },
  )
  dispararDescarga(res.data, nombre)
}

export async function descargarCertificadoRevision(postulacionId, skillId, nombre) {
  const res = await client.get(
    `/revision/postulaciones/${postulacionId}/skills/${skillId}/certificado/archivo`,
    { responseType: 'blob' },
  )
  dispararDescarga(res.data, nombre)
}

export { mensajeErrorBlob }