// Reglas de presentación de la evaluación de un aspirante.

// Mínimo de cumplimiento (%) para pasar a selección. Es el mismo que aplica el
// backend al guardar (pasa_seleccion); aquí solo sirve para anticiparlo mientras
// se califica.
export const UMBRAL_CUMPLIMIENTO = 60

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

// Lo que demuestra cada estado de documento de la API: 'subido' solo dice que
// el aspirante cargó un archivo; ninguna parte del contrato indica que alguien
// lo haya validado. Que el requisito se cumple lo decide el evaluador (Sí/No).
export const ESTADO_DOCUMENTO = {
  subido: { texto: 'Subido', tono: 'azul' },
  pendiente: { texto: 'Sin subir', tono: 'aviso' },
  no_aplica: { texto: 'No aplica', tono: 'neutral' },
}

// "33.33 %": hasta dos decimales, sin ceros sobrantes y con espacio sin ruptura
// antes del %, para que el signo no quede solo en otra línea.
export const formatearPeso = (peso) => `${Math.round(Number(peso) * 100) / 100} %`
