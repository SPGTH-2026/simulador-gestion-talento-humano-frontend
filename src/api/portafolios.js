import client from './client'

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

// Los PDF se abren en una pestaña nueva con ?inline=1 (Content-Disposition:
// inline). Las descargas clásicas siguen siendo GET sin ese parámetro.

// ── Gestión documental del administrador (permiso 'documentos:gestionar') ──
// Requieren el permiso y el alcance por ficha; no exigen ventana ni estado
// editable. Las rutas van sin el prefijo /api (lo añade client.js).

// POST /api/revision/postulaciones/{id}/documentos (multipart: codigo + archivo)
// 201 si es nuevo, 200 si reemplaza el existente.
export const reemplazarDocumentoGestion = (postulacionId, codigo, archivo) => {
  const datos = new FormData()
  datos.append('codigo', codigo)
  datos.append('archivo', archivo)
  return client
    .post(`/revision/postulaciones/${postulacionId}/documentos`, datos)
    .then((res) => res.data.data)
}

// POST /api/revision/postulaciones/{id}/documentos/adicionales
// multipart: titulo, nota (opcional), archivo y documento_id (opcional, para reemplazar)
export const guardarAdicionalGestion = (postulacionId, { titulo, nota, archivo, documentoId }) => {
  const datos = new FormData()
  datos.append('titulo', titulo)
  if (nota) datos.append('nota', nota)
  if (documentoId) datos.append('documento_id', String(documentoId))
  datos.append('archivo', archivo)
  return client
    .post(`/revision/postulaciones/${postulacionId}/documentos/adicionales`, datos)
    .then((res) => res.data.data)
}

// DELETE /api/revision/postulaciones/{id}/documentos/{documento}  ->  204
export const eliminarDocumentoGestion = (postulacionId, documentoId) =>
  client.delete(`/revision/postulaciones/${postulacionId}/documentos/${documentoId}`)

// POST /api/revision/postulaciones/{id}/skills/{skill}/certificado (multipart: archivo)
export const subirCertificadoGestion = (postulacionId, skillId, archivo) => {
  const datos = new FormData()
  datos.append('archivo', archivo)
  return client
    .post(`/revision/postulaciones/${postulacionId}/skills/${skillId}/certificado`, datos)
    .then((res) => res.data.data)
}

// DELETE /api/revision/postulaciones/{id}/skills/{skill}/certificado  ->  204
export const quitarCertificadoGestion = (postulacionId, skillId) =>
  client.delete(`/revision/postulaciones/${postulacionId}/skills/${skillId}/certificado`)
