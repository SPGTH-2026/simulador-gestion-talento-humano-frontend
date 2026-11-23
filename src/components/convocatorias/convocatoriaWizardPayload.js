// Arma el cuerpo que se envía al API al guardar o publicar. Solo llega aquí lo que pasó la validación.
// `esNueva` y `fichas` deciden si la ficha viaja: solo al crear y solo si el usuario tiene más de una.
export function construirPayload(form, { esNueva, fichas }) {
  return {
    nombre: form.nombre.trim(),
    cargo: form.cargo.trim() || null,
    area: form.area.trim() || null,
    descripcion: form.descripcion.trim() || null,
    vacantes: form.vacantes === '' ? 1 : Number(form.vacantes),
    salario_min: form.salario_min === '' ? null : Number(form.salario_min),
    salario_max: form.salario_max === '' ? null : Number(form.salario_max),
    funciones: form.funciones.trim() || null,
    responsabilidades: form.responsabilidades.trim() || null,
    perfil_requerido: form.perfil_requerido.trim() || null,
    formacion: form.formacion.trim() || null,
    experiencia: form.experiencia.trim() || null,
    competencias: form.competencias.trim() || null,
    conocimientos_especificos: form.conocimientos_especificos.trim() || null,
    tipo_convocatoria: form.tipo_convocatoria || null,
    tipo_empleo: form.tipo_empleo || null,
    tipo_contrato: form.tipo_contrato || null,
    modalidad: form.modalidad || null,
    fecha_apertura: form.fecha_apertura || null,
    fecha_cierre: form.fecha_cierre || null,
    fecha_evaluacion: form.fecha_evaluacion || null,
    // Cada skill viaja con su parametro_id (catálogo) o sin él (texto libre).
    skills: form.skills.map((s) => ({
      nombre: s.nombre,
      parametro_id: s.parametro_id ?? null,
    })),
    documentos: form.documentos.map((identificador) => {
      const peso = String(form.ponderaciones[identificador] ?? '').trim()

      return {
        // Los documentos del catálogo viajan por código; los nuevos, por id.
        ...(typeof identificador === 'number'
          ? { id: identificador }
          : { codigo: identificador }),
        // null = sin configurar en esta convocatoria (reparto equitativo).
        ponderacion: peso === '' ? null : Number(peso),
      }
    }),
    // La ficha solo se manda al crear y solo si el usuario tiene más de una:
    // con una sola, el backend la hereda de la sesión. Al editar no se envía:
    // la convocatoria ya tiene ficha y no se puede mover.
    ...(esNueva && fichas.length > 1 ? { ficha_id: form.ficha_id || null } : {}),
  }
}
