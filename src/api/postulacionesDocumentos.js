import client from './client'

// API del paso de DOCUMENTOS y SKILLS de una postulación (contrato del backend,
// documentos 28 y 29). Todas las rutas exigen sesión y el permiso
// 'propio:documentos'; el backend responde 404 en español si la postulación es
// ajena o no existe, y 422 (mensaje en español) si algo no procede.
//
// Reglas del contrato que respetan estas funciones:
//   - Subida multipart: NO se fija Content-Type a mano; axios arma el
//     multipart con su boundary y el interceptor de client.js añade el CSRF.
//   - Descargas: se piden como Blob (con credenciales) y se disparan como
//     descarga con el nombre original; si fallan, el cuerpo del error también
//     es un Blob y hay que leerlo como texto para mostrar el mensaje.

// GET /api/postulaciones/{id}/documentos  ->  { data: {...} }  estado completo.
export const estadoDocumentos = (postulacionId) =>
  client.get(`/postulaciones/${postulacionId}/documentos`).then((res) => res.data.data)

// GET /api/perfil  ->  { data: { sexo: { id, codigo, nombre } | null } }
// Es del USUARIO, no de la convocatoria: funciona sin ninguna postulación.
// Solo el aspirante lo tiene (otro rol recibe 403).
export const obtenerPerfil = () =>
  client.get('/perfil').then((res) => res.data.data)

// PUT /api/perfil/sexo  body { sexo: 'hombre' | 'mujer' }
// El sexo NO depende de la ventana (se puede cambiar con la convocatoria abierta)
// y queda prellenado entre postulaciones. NO crea postulación.
export const guardarSexo = (sexo) =>
  client.put('/perfil/sexo', { sexo }).then((res) => res.data.data.sexo)

// POST /api/postulaciones/{id}/documentos  (multipart: codigo + archivo)
// 201 si es nuevo, 200 si reemplaza el existente.
export const subirDocumento = (postulacionId, codigo, archivo) => {
  const datos = new FormData()
  datos.append('codigo', codigo)
  datos.append('archivo', archivo)
  return client
    .post(`/postulaciones/${postulacionId}/documentos`, datos)
    .then((res) => res.data.data)
}

// DELETE /api/postulaciones/{id}/documentos/{documento}  ->  204
export const eliminarDocumento = (postulacionId, documentoId) =>
  client.delete(`/postulaciones/${postulacionId}/documentos/${documentoId}`)

// POST /api/postulaciones/{id}/documentos/adicionales
//   multipart: titulo (obligatorio), nota (opcional), archivo
export const subirAdicional = (postulacionId, { titulo, nota, archivo }) => {
  const datos = new FormData()
  datos.append('titulo', titulo)
  if (nota) datos.append('nota', nota)
  datos.append('archivo', archivo)
  return client
    .post(`/postulaciones/${postulacionId}/documentos/adicionales`, datos)
    .then((res) => res.data.data)
}

// POST /api/postulaciones/{id}/skills  (doc 33)
// SOLO se admite la skill que pide la convocatoria:
//   { convocatoria_skill_id }  skill pedida por la convocatoria (origen 'convocatoria')
// El backend rechaza (422) las skills del catálogo general y los nombres
// libres: el aspirante solo marca lo que pide la convocatoria.
// Idempotente por nombre sin distinguir mayúsculas (200 si ya estaba).
export const declararSkill = (postulacionId, { convocatoriaSkillId } = {}) => {
  const cuerpo = { convocatoria_skill_id: convocatoriaSkillId }
  return client
    .post(`/postulaciones/${postulacionId}/skills`, cuerpo)
    .then((res) => res.data.data)
}

// DELETE /api/postulaciones/{id}/skills/{skill}  ->  204
export const eliminarSkill = (postulacionId, skillId) =>
  client.delete(`/postulaciones/${postulacionId}/skills/${skillId}`)

// POST /api/postulaciones/{id}/skills/{skill}/certificado  (multipart: archivo)
export const subirCertificado = (postulacionId, skillId, archivo) => {
  const datos = new FormData()
  datos.append('archivo', archivo)
  return client
    .post(`/postulaciones/${postulacionId}/skills/${skillId}/certificado`, datos)
    .then((res) => res.data.data)
}

// DELETE /api/postulaciones/{id}/skills/{skill}/certificado  ->  204
export const quitarCertificado = (postulacionId, skillId) =>
  client.delete(`/postulaciones/${postulacionId}/skills/${skillId}/certificado`)

// ── Archivos autorizados ───────────────────────────────────────────────

// Descarga (fuerza la bajada con el nombre original). Se conserva para otras
// pantallas y para los flujos que sí descargan.
export function dispararDescarga(blob, nombre) {
  const url = URL.createObjectURL(blob)
  const enlace = document.createElement('a')
  enlace.href = url
  enlace.download = nombre || 'documento.pdf'
  document.body.appendChild(enlace)
  enlace.click()
  enlace.remove()
  URL.revokeObjectURL(url)
}

// Abre un Blob en una PESTAÑA NUEVA (para "Ver" un PDF sin forzar la descarga).
// El navegador usa el visor de PDF si el archivo es un PDF. `objetoPestana` es
// la ventana YA abierta por el evento de clic (evita el bloqueador de
// emergentes); si no llegó, se abre aquí. Devuelve true si abrió algo.
//
// Nota: la URL del Blob se mantiene viva (no se revoca aquí) para que la
// pestaña alcance a cargar el PDF; el navegador la libera al cerrar la pestaña.
export function abrirBlobEnPestanaNueva(blob, objetoPestana = null) {
  const url = URL.createObjectURL(blob)
  const pestana = objetoPestana ?? window.open('', '_blank', 'noopener')
  if (!pestana) {
    URL.revokeObjectURL(url)
    return false
  }
  pestana.location.href = url
  return true
}

// GET /api/postulaciones/{id}/documentos/{documento}/archivo
export async function descargarDocumento(postulacionId, documentoId, nombre) {
  const res = await client.get(
    `/postulaciones/${postulacionId}/documentos/${documentoId}/archivo`,
    { responseType: 'blob' },
  )
  dispararDescarga(res.data, nombre)
}

// GET del mismo archivo, pero abierto en pestaña nueva (acción "Ver"). Reutiliza
// la MISMA llamada autenticada; no cambia la autenticación ni el backend.
export async function verDocumento(postulacionId, documentoId, objetoPestana = null) {
  const res = await client.get(
    `/postulaciones/${postulacionId}/documentos/${documentoId}/archivo`,
    { responseType: 'blob' },
  )
  return abrirBlobEnPestanaNueva(res.data, objetoPestana)
}

// GET /api/postulaciones/{id}/skills/{skill}/certificado/archivo
export async function descargarCertificado(postulacionId, skillId, nombre) {
  const res = await client.get(
    `/postulaciones/${postulacionId}/skills/${skillId}/certificado/archivo`,
    { responseType: 'blob' },
  )
  dispararDescarga(res.data, nombre)
}

// Igual que descargarCertificado pero en pestaña nueva (acción "Ver").
export async function verCertificado(postulacionId, skillId, objetoPestana = null) {
  const res = await client.get(
    `/postulaciones/${postulacionId}/skills/${skillId}/certificado/archivo`,
    { responseType: 'blob' },
  )
  return abrirBlobEnPestanaNueva(res.data, objetoPestana)
}

// Los errores de una descarga Blob traen el { message } del backend dentro de un
// Blob (no como JSON ya parseado). Devuelve el mensaje en español o '' si no se
// puede leer. Así un archivo físico ausente (404) se muestra sin romper la lista.
export async function mensajeErrorBlob(error) {
  const datos = error?.response?.data
  if (!(datos instanceof Blob)) return ''
  try {
    const json = JSON.parse(await datos.text())
    return json?.message ?? ''
  } catch {
    return ''
  }
}
