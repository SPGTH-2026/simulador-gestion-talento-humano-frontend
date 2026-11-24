// Orientación del flujo de Selección: textos y rutas de «qué sigue». El servidor es quien decide quién avanza; aquí solo se
// explican, con las palabras de lo que exige el sistema, los requisitos y el siguiente paso de cada modalidad.

// Ruta de cada pantalla del flujo, siempre con la convocatoria seleccionada.
export const rutaPreseleccion = (convocatoriaId) => `/seleccion/preseleccion?convocatoria=${convocatoriaId}`
export const rutaConfiguracion = (convocatoriaId) => `/seleccion/preseleccion?convocatoria=${convocatoriaId}&pestana=configuracion`
export const rutaRanking = (convocatoriaId) => `/seleccion?convocatoria=${convocatoriaId}&pestana=ranking`
export const rutaDecidir = (convocatoriaId) => `/seleccion/decidir?convocatoria=${convocatoriaId}`

// Requisitos reales para que un candidato quede «listo» para elegirse como finalista. No basta con tener archivos cargados:
// cuenta la habilitación documental (que incluye la referencia vigente cuando hay más de una evaluación) y que estén
// completos los documentos obligatorios que le aplican. Con actividades, además, todas las notas configuradas.
export const REQUISITOS_LISTO =
  'No basta con haber cargado archivos: el candidato debe estar habilitado documentalmente (con su referencia vigente si tiene más de una evaluación) y tener completos sus documentos obligatorios.'
export const REQUISITO_NOTAS = 'También deben estar calificadas todas las actividades configuradas.'

export const requisitosListo = (modo) => (modo === 'sin_actividades' ? REQUISITOS_LISTO : `${REQUISITOS_LISTO} ${REQUISITO_NOTAS}`)

// Qué falta decir de los candidatos que aún no están listos, según la modalidad.
export const FALTA_PARA_ESTAR_LISTO = {
  sin_actividades: 'la habilitación documental, la referencia vigente o algún documento obligatorio',
  con_actividades: 'la habilitación documental, la referencia vigente, algún documento obligatorio o alguna nota',
}

// Siguiente paso tras configurar las actividades, según la modalidad elegida.
// Una frase por modalidad: los requisitos completos van en la ayuda desplegable (AyudaRequisitos).
export const SIGUIENTE_PASO = {
  sin_actividades: 'No se piden notas: revisa los documentos y elige a mano a los finalistas, con su justificación.',
  con_actividades: 'Registra las calificaciones de cada candidato; con todas completas podrá elegirse como finalista.',
}
