// Reglas y ayudas del paso de documentos de la postulación. Los números espejan
// config/convocatorias.php del backend (fuente de verdad), que es quien decide:
//   tamano_maximo_mb = 3, documentos_adicionales_max = 5,
//   skills_postulacion_max = 30, titulo_adicional_max_longitud = 120,
//   nota_adicional_max_longitud = 500.
// El nombre de una skill propia está topado a 100 en el controlador de skills.
// (skills_max = 20 son las skills de la CONVOCATORIA, que no cambia; el tope de
// skills declaradas en la postulación pasó de 20 a 30 en el doc 33.)

export const MAX_DOCUMENTOS_ADICIONALES = 5
export const MAX_SKILLS = 30
export const MAX_SKILL_NOMBRE = 100
export const MAX_TITULO_ADICIONAL = 120
export const MAX_NOTA_ADICIONAL = 500

export const CODIGO_LIBRETA_MILITAR = 'libreta_militar'

// Compara nombres de skill sin distinguir mayúsculas ni espacios sobrantes. El
// backend guarda UNIQUE(postulacion_id, nombre) y resuelve duplicados por
// LOWER(nombre); el front usa la misma normalización para cruzar catálogo /
// convocatoria / declaradas.
export function normalizarSkill(texto) {
  return String(texto ?? '').trim().toLowerCase()
}

// ¿La convocatoria pide la libreta militar? Se mira la lista de documentos del
// estado (cada uno trae su código). Así no dependemos de 'requiere_sexo', que
// solo dice si FALTA registrar el sexo.
export function pideLibreta(documentos) {
  return (documentos ?? []).some((d) => d.parametro?.codigo === CODIGO_LIBRETA_MILITAR)
}

// Motivo por el que el paso NO es editable ('' si sí lo es). Se apoya en el
// 'ventana' que manda el backend ('abierta'|'antes'|'cerrada'|'no_publicada') y
// en el estado de la postulación.
export function motivoNoEditable(estado) {
  if (!estado || estado.editable) return ''

  if (estado.postulacion?.estado?.codigo === 'retirada') {
    return 'Tu postulación está retirada. Reábrela para editar tus documentos.'
  }

  switch (estado.ventana) {
    case 'antes':
      return 'La convocatoria aún no está abierta. Podrás subir documentos cuando abra.'
    case 'cerrada':
      return 'La convocatoria ya cerró. Tus documentos quedaron solo para consulta.'
    case 'no_publicada':
      return 'La convocatoria no está publicada.'
    default:
      return 'Este paso está en solo lectura.'
  }
}

// bytes -> "340 KB" / "1,2 MB". Sin decimales por debajo de 1 MB.
export function formatearTamano(bytes) {
  if (bytes == null) return '—'
  if (bytes < 1024) return `${bytes} B`
  const kb = bytes / 1024
  if (kb < 1024) return `${Math.round(kb)} KB`
  return `${(kb / 1024).toFixed(1).replace('.', ',')} MB`
}

// Progreso de los documentos obligatorios: cuántos están listos (subidos o en
// 'no_aplica') sobre el total. Los opcionales y los adicionales no cuentan.
export function progresoObligatorios(documentos) {
  const obligatorios = (documentos ?? []).filter((d) => d.obligatorio)
  const cumplidos = obligatorios.filter(
    (d) => d.estado === 'subido' || d.estado === 'no_aplica',
  ).length
  return { cumplidos, total: obligatorios.length }
}
