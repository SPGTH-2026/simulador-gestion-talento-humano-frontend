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
          // Solo los obligatorios y aplicables pesan en el 60 %. El backend
          // aplica la misma regla; aquí se refleja para que la vista previa
          // coincida con lo que se guarda.
          obligatorio: Boolean(d.obligatorio),
          // Peso (%) configurado para este documento en la convocatoria.
          // null = la convocatoria no configuró porcentajes.
          ponderacion: d.ponderacion != null ? Number(d.ponderacion) : null,
          archivo: d.archivo ?? null,
          estado:
            d.estado === 'subido'
              ? 'validado'
              : d.estado === 'no_aplica'
                ? 'no_aplica'
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
