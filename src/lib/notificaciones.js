// Presentación de una notificación (la usan el panel de la campana y la página, para que se vean igual).

const ACCIONES_POR_RUTA = [
  ['/mis-evaluaciones', 'Ver evaluación'],
  ['/mis-postulaciones', 'Ver postulación'],
  ['/convocatorias', 'Ver convocatoria'],
  ['/seleccion', 'Ir a Selección'],
  ['/evaluacion', 'Ir a Evaluación'],
]

/** Texto de la acción según el destino del aviso; null si no tiene destino (entonces no se presenta como navegable). */
export function accionDeNotificacion(item) {
  if (!item.url) return null
  if (item.tipo === 'citacion') return 'Ver citación'
  return ACCIONES_POR_RUTA.find(([ruta]) => item.url.startsWith(ruta))?.[1] ?? 'Abrir'
}

/**
 * El texto guardado puede traer la aclaración «(hora de Colombia)» (los avisos de citas); en pantalla es redundante porque todo el
 * sistema muestra la hora de Colombia. Solo cambia lo que se lee: la hora no se recalcula.
 */
export const mensajeDeNotificacion = (item) => String(item.mensaje ?? '').replace(/\s*\(hora de Colombia\)/gi, '')

export const FILTROS_PANEL = [
  { id: 'todas', etiqueta: 'Todas' },
  { id: 'no_leidas', etiqueta: 'No leídas' },
  { id: 'leidas', etiqueta: 'Leídas' },
]
export const FILTROS_PAGINA = [...FILTROS_PANEL, { id: 'ocultas', etiqueta: 'Ocultas' }]

const VACIO_POR_FILTRO = {
  leidas: 'Aún no has leído ninguna notificación.',
  ocultas: 'No tienes notificaciones ocultas.',
}

export const FILTROS_VALIDOS = FILTROS_PAGINA.map((f) => f.id)

/**
 * Texto de la lista vacía. Con «No leídas» vacío no se afirma que no haya historial: «Estás al día» y se ofrece consultar el resto.
 * «No tienes notificaciones» (no hay ninguna) se distingue de «No hay notificaciones en este filtro».
 */
export const textoVacio = (filtro) => {
  if (filtro === 'no_leidas') return { titulo: 'Estás al día', descripcion: 'No tienes notificaciones sin leer.' }
  if (filtro === 'todas') return { titulo: 'No tienes notificaciones', descripcion: 'Aquí aparecerán los avisos que correspondan a tu rol.' }
  return { titulo: 'No hay notificaciones en este filtro', descripcion: VACIO_POR_FILTRO[filtro] }
}
