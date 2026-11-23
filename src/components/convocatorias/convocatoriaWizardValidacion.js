import { formatearFecha, hoyEnBogota } from '../../lib/ventanaPostulacion'
import { REQUERIDOS_PUBLICAR } from './convocatoriaWizardUtils'

// Reglas de validación del asistente de convocatorias. Son funciones puras: reciben el formulario y devuelven
// { campo: mensaje } (o un texto de error). Así se leen y se prueban sin montar el componente.

// Porcentaje escrito para un documento. Vacío = sin configurar.
export function valorPonderacion(form, codigo) {
  return form.ponderaciones[codigo] ?? ''
}

// Suma de los porcentajes de los documentos elegidos.
export function sumaDePonderaciones(form) {
  return form.documentos.reduce((acc, codigo) => acc + (Number(valorPonderacion(form, codigo)) || 0), 0)
}

// Devuelve el mensaje de error o null. Sin porcentajes configurados es válido.
export function validarPonderaciones(form) {
  const configurados = form.documentos.filter((codigo) => String(valorPonderacion(form, codigo)).trim() !== '')

  if (configurados.length === 0) return null

  if (configurados.length !== form.documentos.length) {
    return 'Define el porcentaje de todos los documentos: deben sumar 100%.'
  }

  const suma = sumaDePonderaciones(form)
  if (Math.abs(suma - 100) > 0.01) {
    return `Los porcentajes de los documentos deben sumar 100% (suman ${Math.round(suma * 100) / 100}%).`
  }

  return null
}

// Lo que impide guardar un borrador. Nada de esto bloquea recorrer los pasos.
export function calcularErroresBorrador(form, { esNueva, fichas }) {
  const e = {}
  if (!form.nombre.trim()) e.nombre = 'Escribe el nombre de la convocatoria.'
  if (esNueva && fichas.length > 1 && !form.ficha_id) e.ficha_id = 'Elige la ficha de la convocatoria.'

  if (form.vacantes !== '' && !(Number.isInteger(Number(form.vacantes)) && Number(form.vacantes) >= 1)) {
    e.vacantes = 'Las vacantes deben ser un número entero de 1 o más.'
  }
  if (form.salario_min !== '' && form.salario_max !== '' && Number(form.salario_max) < Number(form.salario_min)) {
    e.salario_max = 'El salario máximo debe ser mayor o igual que el mínimo.'
  }
  if (form.fecha_apertura && form.fecha_cierre && form.fecha_cierre < form.fecha_apertura) {
    e.fecha_cierre = 'La fecha de cierre debe ser posterior o igual a la de apertura.'
  }
  const errorPonderaciones = validarPonderaciones(form)
  if (errorPonderaciones) e.documentos = errorPonderaciones
  return e
}

// Lo que impide publicar: lo del borrador, más los datos requeridos para publicar y un cierre que no sea pasado.
export function calcularErroresPublicacion(form, opciones) {
  const e = calcularErroresBorrador(form, opciones)
  for (const [campo, mensaje] of Object.entries(REQUERIDOS_PUBLICAR)) {
    if (!String(form[campo] ?? '').trim()) e[campo] ??= mensaje
  }
  // Solo el cierre se valida contra hoy (contrato RF-CON-011). Una apertura pasada es válida: la convocatoria queda abierta
  // al publicarla; se avisa en el paso 5 (calcularAvisosFechas) pero no se bloquea.
  const hoy = hoyEnBogota()
  if (form.fecha_cierre && form.fecha_cierre < hoy) {
    e.fecha_cierre ??= 'La fecha de cierre no puede estar en el pasado.'
  }
  return e
}

// Avisos informativos del paso 5. No cuentan como pendientes ni bloquean guardar o publicar: el contrato admite estos
// casos y solo conviene que la persona sepa qué efecto tienen.
export function calcularAvisosFechas(form, { puedePublicar }) {
  const avisos = []
  const hoyAviso = hoyEnBogota()
  if (puedePublicar && form.fecha_apertura && form.fecha_apertura < hoyAviso) {
    avisos.push({
      clave: 'apertura',
      tono: 'info',
      texto: `La apertura (${formatearFecha(form.fecha_apertura)}) ya pasó: la convocatoria quedará abierta a los aspirantes apenas la publiques.`,
    })
  }
  if (form.fecha_evaluacion && form.fecha_cierre && form.fecha_evaluacion < form.fecha_cierre) {
    avisos.push({
      clave: 'evaluacion-antes-cierre',
      tono: 'info',
      texto: `La evaluación empieza el ${formatearFecha(form.fecha_evaluacion)}, antes del cierre: desde ese día quienes ya enviaron su postulación no podrán editarla ni reemplazar documentos. Los aspirantes podrán seguir postulándose hasta el ${formatearFecha(form.fecha_cierre)}.`,
    })
  }
  if (form.fecha_evaluacion && form.fecha_apertura && form.fecha_evaluacion < form.fecha_apertura) {
    avisos.push({
      clave: 'evaluacion-antes-apertura',
      tono: 'aviso',
      texto: 'La fecha de evaluación es anterior a la apertura. Revisa que sea la correcta.',
    })
  }
  return avisos
}
