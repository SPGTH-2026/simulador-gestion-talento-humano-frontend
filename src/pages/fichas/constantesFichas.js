export const ESTADOS = [
  { valor: 'activa', etiqueta: 'Activa' },
  { valor: 'cerrada', etiqueta: 'Cerrada' },
]

// Cuántos instructores se nombran en una tarjeta o en una fila; el resto se consulta en el diálogo de instructores.
export const INSTRUCTORES_EN_TARJETA = 3
export const INSTRUCTORES_EN_TABLA = 2

// `fichas.creado_por` guarda quién REGISTRÓ la ficha: lo asigna el sistema al crearla, no se envía ni se reasigna, y queda vacío si
// la persona se dio de baja o la ficha es anterior a ese dato. Por eso se llama «Creada por» y, sin dato, «Sin registro».
export const TEXTO_SIN_REGISTRO = 'Sin registro'

// El listado llega ordenado por código; al insertar o cambiar una ficha en local se conserva ese orden.
export const ordenarPorCodigo = (fichas) => [...fichas].sort((a, b) => a.codigo.localeCompare(b.codigo, 'es', { numeric: true }))
