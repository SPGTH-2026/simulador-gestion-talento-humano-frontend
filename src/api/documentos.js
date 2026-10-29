import client from './client'

// GET /api/revision/postulaciones/{postulacionId}/documentos
//   -> { data: { documentos: [ { parametro, obligatorio, estado, archivo } ],
//                skills: [ { id, nombre, origen, certificado } ],
//                ... } }
// 'estado': 'subido' | 'pendiente' | 'no_aplica'
export const listaDocumentos = (postulacionId) =>
  client.get(`/revision/postulaciones/${postulacionId}/documentos`).then((res) => {
    const payload = res.data?.data ?? res.data ?? {}
    const docs = payload.documentos ?? []
    const skills = payload.skills ?? []
    return {
      data: docs
        .filter((d) => d.parametro?.nombre)
        .map((d) => ({
          id: `doc-${d.parametro.id}`,
          nombre: d.parametro.nombre,
          tipo: 'documento',
          estado:
            d.estado === 'subido'
              ? 'validado'
              : d.estado === 'no_aplica'
                ? 'validado'
                : 'cargado',
        })),
      skills: skills.map((s) => ({
        id: `skill-${s.id}`,
        nombre: s.nombre,
        tipo: 'skill',
        estado: s.certificado ? 'validado' : 'cargado',
      })),
    }
  })
