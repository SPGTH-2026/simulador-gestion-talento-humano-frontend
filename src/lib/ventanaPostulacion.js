// Reglas de la ventana de postulación, replicadas del backend
// (Convocatoria::ventanaPostulacion + enum VentanaPostulacion).
//
// Todo se decide comparando cadenas 'AAAA-MM-DD'. Nunca new Date() ni
// toISOString() sobre la fecha del negocio: esas funciones vuelven UTC y en
// Colombia desplazarían un día.

// "Hoy" en America/Bogota como cadena AAAA-MM-DD. 'en-CA' produce justo ese
// orden. El timeZone fijo evita que un navegador en otra zona cambie el día.
export function hoyEnBogota() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Bogota',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())
}

// dd/mm/aaaa. Se corta la cadena ISO 'aaaa-mm-dd' a mano; nunca new Date().
export function formatearFecha(iso) {
  if (!iso) return '—'
  const [anio, mes, dia] = String(iso).slice(0, 10).split('-')
  return anio && mes && dia ? `${dia}/${mes}/${anio}` : iso
}

// dd/mm/aaaa para un TIMESTAMP completo (fecha_postulacion, fecha_retiro). Aquí
// sí se pasa por Date y se fija America/Bogota: el backend envía un ISO con hora
// (p. ej. 2026-10-12T05:00:00+00:00) y cortarlo mostraría el día en UTC. Así se
// ve la fecha real en hora local.
export function formatearFechaHora(iso) {
  if (!iso) return '—'
  const fecha = new Date(iso)
  if (Number.isNaN(fecha.getTime())) return formatearFecha(iso)
  return new Intl.DateTimeFormat('es-CO', {
    timeZone: 'America/Bogota',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(fecha)
}

function soloFecha(valor) {
  return valor ? String(valor).slice(0, 10) : null
}

// Misma precedencia que Convocatoria::ventanaPostulacion():
//   no_publicada -> 'no_publicada'
//   hoy < apertura      -> 'antes'
//   hoy > cierre        -> 'cerrada'
//   en otro caso        -> 'abierta'
// Los extremos son inclusive y una fecha nula cierra la ventana.
export function estadoVentana(convocatoria) {
  if (!convocatoria || convocatoria.estado?.codigo !== 'publicada') return 'no_publicada'

  const hoy = hoyEnBogota()
  const apertura = soloFecha(convocatoria.fecha_apertura)
  const cierre = soloFecha(convocatoria.fecha_cierre)

  if (!apertura || hoy < apertura) return 'antes'
  if (!cierre || hoy > cierre) return 'cerrada'
  return 'abierta'
}

export function puedePostular(convocatoria) {
  return estadoVentana(convocatoria) === 'abierta'
}

// Texto legible del estado de una postulación. El borrador se explicita como
// "Borrador, sin enviar" (el nombre del parámetro es solo "Borrador") para
// dejar claro que aún NO cuenta como una postulación enviada. El resto usa el
// nombre que manda el backend ('Postulada', 'Retirada').
export function etiquetaEstadoPostulacion(codigo, nombre) {
  if (codigo === 'borrador') return 'Borrador, sin enviar'
  return nombre ?? codigo ?? '—'
}

// Motivo legible para el tooltip cuando el botón está deshabilitado por fechas.
export function textoVentana(convocatoria) {
  const estado = estadoVentana(convocatoria)

  if (estado === 'antes') {
    return `Aún no abre (${formatearFecha(convocatoria?.fecha_apertura)})`
  }
  if (estado === 'cerrada') {
    return `Ya cerró (${formatearFecha(convocatoria?.fecha_cierre)})`
  }
  if (estado === 'no_publicada') {
    return 'La convocatoria no está publicada'
  }
  return ''
}
