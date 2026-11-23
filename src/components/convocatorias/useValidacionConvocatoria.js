import { hoyEnBogota } from '../../lib/ventanaPostulacion'
import { ETAPA_DE_CAMPO } from './convocatoriaWizardUtils'
import { calcularAvisosFechas, calcularErroresBorrador, calcularErroresPublicacion } from './convocatoriaWizardValidacion'

// Validación del asistente en vivo: qué falta para guardar y para publicar, los avisos de fechas y el error que
// muestra cada campo. Las reglas son funciones puras (convocatoriaWizardValidacion.js); aquí solo se aplican al
// formulario actual. 'intento' dice qué se intentó por última vez (guardar o publicar).
export default function useValidacionConvocatoria({ form, esNueva, fichas, soloLectura, puedePublicar, errores, intento }) {
  const editable = !soloLectura
  const avisosFechas = editable ? calcularAvisosFechas(form, { puedePublicar }) : []
  // Al publicar, el selector del CIERRE no ofrece días pasados (hoy en Colombia): es lo que exige el servidor. La apertura sí
  // admite una fecha pasada. Al editar una convocatoria ya publicada no hay mínimo.
  const minimoFecha = puedePublicar && editable ? hoyEnBogota() : undefined
  const erroresBor = editable ? calcularErroresBorrador(form, { esNueva, fichas }) : {}
  const erroresPub = editable && puedePublicar ? calcularErroresPublicacion(form, { esNueva, fichas }) : erroresBor
  // Lo que falta para publicar, agrupado por paso: guía permanente (también en un borrador recién creado).
  const pendientes = Object.keys(erroresPub).sort((x, y) => (ETAPA_DE_CAMPO[x] ?? 9) - (ETAPA_DE_CAMPO[y] ?? 9))
  const erroresDelIntento = intento === 'publicar' ? erroresPub : intento === 'guardar' ? erroresBor : {}

  // El servidor manda; si no, lo que falta solo se muestra tras intentar guardar o publicar, y se recalcula al escribir.
  const errorDe = (campo) =>
    errores[campo] ?? (intento === 'publicar' ? erroresPub[campo] : intento === 'guardar' ? erroresBor[campo] : undefined)

  return { editable, avisosFechas, minimoFecha, erroresBor, erroresPub, pendientes, erroresDelIntento, errorDe }
}
