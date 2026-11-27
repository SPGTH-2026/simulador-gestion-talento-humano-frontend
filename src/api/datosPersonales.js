import client from './client'

// GET /api/revision/postulaciones/{id}/datos-personales  ->  { completo, es_menor, edad_minima, datos | null }
// Solo lectura para quien revisa (permiso 'documentos:ver'), con alcance por ficha: fuera de su ficha o con la postulación en
// borrador responde 404. Trae los datos del aspirante y, si es menor de edad, los de su representante legal.
export const obtenerDatosPersonalesRevision = (postulacionId) =>
  client.get(`/revision/postulaciones/${postulacionId}/datos-personales`).then((res) => res.data.data)
