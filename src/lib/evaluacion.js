// Reglas de presentación de la evaluación de un aspirante.

import { hoyEnBogota } from './ventanaPostulacion'

// Mínimo de cumplimiento (%) para pasar a selección. Es el mismo que aplica el
// backend al guardar (pasa_seleccion); aquí solo sirve para anticiparlo mientras
// se califica.
export const UMBRAL_CUMPLIMIENTO = 60

// ¿Ya pasó la fecha de evaluación de la convocatoria? Se comparan cadenas 'AAAA-MM-DD' (hoy en Bogotá). Es solo informativa:
// sin fecha no hay aviso. El día de la fecha todavía no cuenta como pasada.
export const fechaEvaluacionPasada = (fecha, hoy = hoyEnBogota()) => Boolean(fecha) && String(fecha).slice(0, 10) < hoy

// Peso (%) de cada documento. Si la convocatoria no configuró porcentajes,
// todos valen lo mismo (reparto equitativo). Mismo criterio que el backend: lo
// que el gestor no configuró se reparte con lo que sobra del 100 %.
export function repartirPesos(documentos) {
  const pesos = {}
  const sinPeso = []
  let suma = 0

  documentos.forEach((d) => {
    if (d.ponderacion == null) {
      sinPeso.push(d.id)
      return
    }
    pesos[d.id] = Number(d.ponderacion)
    suma += Number(d.ponderacion)
  })

  if (sinPeso.length > 0) {
    const cuota = Math.max(0, 100 - suma) / sinPeso.length
    sinPeso.forEach((id) => {
      pesos[id] = cuota
    })
  }

  return pesos
}

// Lo que demuestra cada estado de documento de la API: 'subido' (código del contrato) solo dice que el aspirante
// cargó un archivo; ninguna parte del contrato indica que alguien lo haya validado. Que el requisito se cumple lo
// decide el evaluador (Cumple / No cumple).
export const ESTADO_DOCUMENTO = {
  subido: { texto: 'Cargado', tono: 'azul' },
  pendiente: { texto: 'Sin cargar', tono: 'aviso' },
  no_aplica: { texto: 'No aplica', tono: 'neutral' },
}

// Porcentaje de la evaluación siempre con dos decimales («5.00 %», «66.67 %»): así se ve que el total es justo.
export const formatearPorcentaje = (valor) => `${(Math.round(Number(valor) * 100) / 100).toFixed(2)} %`

// "33.33 %": hasta dos decimales, sin ceros sobrantes y con espacio sin ruptura
// antes del %, para que el signo no quede solo en otra línea.
export const formatearPeso = (peso) => `${Math.round(Number(peso) * 100) / 100} %`

// ── Calificación por documento, ítems y habilidades ───────────────────────────────────────────────────────────────────
// Misma regla que el servidor (App\Services\Evaluacion\PuntajeDeEvaluacion): los documentos valen 90 puntos y las habilidades
// declaradas 10 (100 para los documentos si la convocatoria no pide habilidades). El servidor manda; esto solo anticipa el
// resultado mientras el evaluador marca. Los puntos de cada elemento llegan en `puntos` (detalle de la evaluación).

// «doc-5» → «5».
export const idParametro = (documentoId) => String(documentoId).replace(/^doc-/, '')

// Clave del ítem n del checklist de un documento en el perfil de la evaluación.
export const claveItem = (documentoId, n) => `docitem-${idParametro(documentoId)}-${n}`

// Cuántos ítems del checklist de un documento cumplen, no cumplen o siguen sin calificar.
export function resumenChecklist(documento, itemMarcas = {}) {
  const items = documento.items ?? []
  const marcas = items.map((_, n) => itemMarcas[claveItem(documento.id, n)])
  const cumplen = marcas.filter((m) => m === true).length
  const noCumplen = marcas.filter((m) => m === false).length
  return { total: items.length, cumplen, noCumplen, sinResponder: items.length - cumplen - noCumplen }
}

// Indicador de un documento CON checklist, para que el evaluador sepa cómo va (no cambia el puntaje, que sigue siendo
// proporcional a los ítems que cumplen). Hay que superar la mitad de los ítems:
//   «cumple»     más de la mitad cumple (3 de 5, 4 de 6)        «no_cumple»  no se puede superar la mitad (2 de 5) o queda justo
//   «en_curso»   todavía puede ir hacia cualquiera              la mitad (3 de 6, 2 de 4): la mitad exacta NO alcanza
// Sin checklist devuelve null: ahí manda el Cumple / No cumple del propio documento.
export function indicadorDocumento(documento, itemMarcas = {}) {
  if ((documento.items ?? []).length === 0) return null
  const { total, cumplen, noCumplen } = resumenChecklist(documento, itemMarcas)
  const necesita = Math.floor(total / 2) + 1
  const estado = cumplen * 2 > total ? 'cumple' : noCumplen * 2 >= total ? 'no_cumple' : 'en_curso'
  return { estado, cumplen, total, necesita }
}

// Resultado del documento: true si cumple, false si no cumple, undefined si todavía no se sabe. Con checklist lo decide la mayoría
// de los ítems (ver indicadorDocumento); sin checklist, el Cumple / No cumple del documento.
export function resultadoDocumento(documento, respuestas = {}, itemMarcas = {}) {
  const indicador = indicadorDocumento(documento, itemMarcas)
  if (!indicador) return respuestas[documento.id]
  return indicador.estado === 'cumple' ? true : indicador.estado === 'no_cumple' ? false : undefined
}

// Botones Cumple / No cumple del documento: solo si NO tiene checklist. Con checklist se califica ítem por ítem y el documento
// muestra su indicador (solo lectura).
export function atajoDocumento(documento, respuestas = {}) {
  return (documento.items ?? []).length === 0
    ? { visible: true, valor: respuestas[documento.id] }
    : { visible: false, valor: undefined }
}

// Puntos que vale cada documento. Sin `puntos` del servidor (pantallas de prueba) se reparte el 100 con repartirPesos.
function puntosDeDocumentos(aplicables, puntos) {
  if (puntos?.documentos) return Object.fromEntries(aplicables.map((d) => [d.id, Number(puntos.documentos[idParametro(d.id)] ?? 0)]))
  const pesos = repartirPesos(aplicables)
  const suma = Object.values(pesos).reduce((acc, v) => acc + v, 0)
  return Object.fromEntries(aplicables.map((d) => [d.id, suma > 0 ? ((pesos[d.id] ?? 0) / suma) * 100 : 0]))
}

// Cumplimiento (0-100) y sus partes. `habilidades` son solo las que el aspirante declaró.
export function calcularPuntaje({ aplicables, respuestas = {}, itemMarcas = {}, habilidades = [], skillMarcas = {}, puntos = null }) {
  const porDocumento = puntosDeDocumentos(aplicables, puntos)
  const maxDocumentos = Object.values(porDocumento).reduce((acc, v) => acc + v, 0)
  const documentos = aplicables.reduce((acc, d) => {
    const items = d.items ?? []
    const fraccion = items.length === 0 ? (respuestas[d.id] === true ? 1 : 0) : resumenChecklist(d, itemMarcas).cumplen / items.length
    return acc + (porDocumento[d.id] ?? 0) * fraccion
  }, 0)
  const maxHabilidades = habilidades.reduce((acc, s) => acc + Number(puntos?.habilidades?.[s.id] ?? 0), 0)
  const obtenidoHabilidades = habilidades.reduce(
    (acc, s) => acc + (skillMarcas[`skill-${s.id}`] === true ? Number(puntos?.habilidades?.[s.id] ?? 0) : 0),
    0,
  )
  return {
    // Con dos decimales, igual que el servidor: el total es justo (66,67 %), no se redondea al entero.
    total: Math.round(Math.min(100, documentos + obtenidoHabilidades) * 100) / 100,
    documentos,
    maxDocumentos,
    habilidades: obtenidoHabilidades,
    maxHabilidades,
    // Lo que vale TODO el bloque de habilidades (10), no solo las declaradas: es el tope que se muestra.
    bloqueHabilidades: Number(puntos?.bloque_habilidades ?? 0),
  }
}

// Cuántas cosas faltan por calificar antes de poder finalizar: ítems de checklist, documentos sin checklist y habilidades
// declaradas. Los documentos que el aspirante no cargó no cuentan aquí: se tratan aparte (no se puede finalizar con ellos).
export function contarPendientes({ aplicables, respuestas = {}, itemMarcas = {}, habilidades = [], skillMarcas = {} }) {
  const enDocumentos = aplicables
    .filter((d) => d.estado !== 'pendiente')
    .reduce((acc, d) => {
      const items = d.items ?? []
      return acc + (items.length === 0 ? (respuestas[d.id] == null ? 1 : 0) : resumenChecklist(d, itemMarcas).sinResponder)
    }, 0)
  const enHabilidades = habilidades.filter((s) => skillMarcas[`skill-${s.id}`] == null).length
  return enDocumentos + enHabilidades
}

// ¿Algo quedó en «No cumple»? (un ítem, un documento sin checklist o una habilidad declarada). Si es así, finalizar exige
// observaciones, aunque el documento en conjunto se considere «Cumple» por mayoría.
export function hayNoCumple({ aplicables, respuestas = {}, itemMarcas = {}, habilidades = [], skillMarcas = {} }) {
  return (
    aplicables.some((d) =>
      (d.items ?? []).length === 0 ? respuestas[d.id] === false : resumenChecklist(d, itemMarcas).noCumplen > 0,
    ) || habilidades.some((s) => skillMarcas[`skill-${s.id}`] === false)
  )
}
