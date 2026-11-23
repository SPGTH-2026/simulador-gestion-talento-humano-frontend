import { formatearFechaHoraExacta } from './ventanaPostulacion'

// Rotulado de las rondas de corrección. El servidor calcula el estado desde las fechas (guardadas en UTC); aquí solo se
// muestran, siempre con fecha y hora exactas en la hora de Colombia.

// Estados de una ronda: 'vigente' es el único en que se puede responder.
export const ESTADO_RONDA = {
  vigente: { tono: 'aviso', texto: 'Vigente' },
  respondida: { tono: 'exito', texto: 'Respondida' },
  vencida: { tono: 'peligro', texto: 'Vencida' },
  sin_plazo: { tono: 'neutral', texto: 'Sin plazo registrado' },
}

export const nombreRonda = (ronda) => (ronda.tipo === 'excepcional' ? 'Ronda excepcional' : `Ronda ${ronda.numero}`)

// Plazo en una frase, con fecha y hora exactas.
export function textoPlazo(ronda) {
  if (ronda.estado === 'sin_plazo') return 'Sin plazo registrado'
  if (ronda.estado === 'respondida') return `Respondida el ${formatearFechaHoraExacta(ronda.respondida_at)}`
  if (ronda.estado === 'vencida') return `Venció el ${formatearFechaHoraExacta(ronda.fecha_limite)}`
  return `Vence el ${formatearFechaHoraExacta(ronda.fecha_limite)}`
}

// Qué le dice la pantalla al aspirante cuando ya no hay nada que corregir.
export const MENSAJES_CERRADOS = {
  respondida: (ronda) =>
    `Enviaste la corrección el ${formatearFechaHoraExacta(ronda.respondida_at)} (hora de Colombia). El evaluador la revisará.`,
  vencida: (ronda) =>
    `El plazo para corregir venció el ${formatearFechaHoraExacta(ronda.fecha_limite)} (hora de Colombia). Los documentos ya no se pueden reemplazar desde aquí.`,
  sin_plazo: () =>
    'Esta solicitud es anterior a los plazos y no tiene plazo registrado, por eso no se puede responder desde aquí. El evaluador puede finalizar con la evidencia disponible.',
}
