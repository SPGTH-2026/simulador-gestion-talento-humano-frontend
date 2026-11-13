import client from './client'

// GET /api/revision/postulaciones/{postulacionId}/documentos
//   -> { data: { documentos: [ { parametro, obligatorio, estado, archivo } ],
//                skills: [ { id, nombre, origen, certificado } ],
//                ... } }
// 'estado': 'subido' | 'pendiente' | 'no_aplica'. 'subido' solo indica que el
// aspirante cargó un archivo; el contrato no trae ninguna validación.
// 'archivo' ({ id, nombre_original, mime, ... } o null) permite abrir el archivo
// real con GET /revision/postulaciones/{id}/documentos/{archivo.id}/archivo.
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
          // Peso (%) configurado para este documento en la convocatoria.
          // null = la convocatoria no configuró porcentajes.
          ponderacion: d.ponderacion != null ? Number(d.ponderacion) : null,
          obligatorio: Boolean(d.obligatorio),
          estado: d.estado,
          archivo: d.archivo ?? null,
        })),
      skills: skills.map((s) => ({
        id: `skill-${s.id}`,
        nombre: s.nombre,
        tipo: 'skill',
        estado: s.certificado ? 'validado' : 'cargado',
      })),
    }
  })
