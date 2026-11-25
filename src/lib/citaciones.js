// Fecha y hora de las citaciones. El backend entrega la fecha ('AAAA-MM-DD') y la hora ('HH:MM') ya en hora de Colombia: aquí solo se
// escriben, sin pasar por la zona horaria del navegador (que podría ser otra).

const FORMATO_FECHA = new Intl.DateTimeFormat('es-CO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })

/** «jueves, 15 de enero de 2030, 14:30 (hora de Colombia)». */
// Con zona=false se omite «(hora de Colombia)» donde la pantalla ya lo dice una vez (p. ej. «Tus citaciones»).
export function textoCuando(fecha, hora, zona = true) {
  const [anio, mes, dia] = fecha.split('-').map(Number)
  return `${FORMATO_FECHA.format(new Date(Date.UTC(anio, mes - 1, dia, 12)))}, ${hora}${zona ? ' (hora de Colombia)' : ''}`
}

/** Hoy en Colombia, 'AAAA-MM-DD' (para el mínimo del selector de fecha). */
export const hoyEnColombia = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Bogota' }).format(new Date())

export const ACTIVIDADES_CITA = { entrevista: 'entrevista', prueba_tecnica: 'prueba técnica' }
