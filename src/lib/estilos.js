// Cadenas canónicas del sistema visual SPGTH.
//
// Viven en un archivo .js (y no en un .jsx) a propósito: así no se exportan
// valores que no son componentes desde un módulo de componentes, que es lo que
// molesta a la regla react-refresh/only-export-components.
//
// Regla de color: el verde institucional (sena) se reserva para la acción
// principal y los estados positivos. Los avisos, errores e informaciones usan
// los alias semánticos exito/aviso/peligro definidos en src/index.css.

// Base de los campos de formulario (input, select, textarea). El tamaño y el
// peso se añaden en cada variante: así nunca conviven dos utilidades en
// conflicto dentro de la misma clase (p. ej. text-sm junto a text-2xl).
const BASE_INPUT =
  'rounded-md border border-sena-azul/20 p-2 focus:border-sena focus:outline-none focus:ring-2 focus:ring-sena/40 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:opacity-70 dark:border-sena-borde dark:bg-sena-noche dark:text-sena-texto dark:disabled:bg-sena-noche/40'

// Campo normal.
export const CLASE_INPUT = `font-normal text-sm text-slate-700 ${BASE_INPUT}`

// Código de verificación (OTP): centrado, en números grandes y espaciados.
export const CLASE_INPUT_CODIGO = `text-center text-2xl font-semibold tracking-[0.5em] text-slate-700 ${BASE_INPUT}`

// Código corto (ficha): centrado y algo más grande que el campo normal.
export const CLASE_INPUT_FICHA = `text-center text-lg font-normal text-slate-700 ${BASE_INPUT}`

// Etiqueta de un campo: texto en columna con su control debajo.
export const CLASE_LABEL = 'flex flex-col gap-1 text-sm font-medium text-sena-azul dark:text-sena-texto'

// Superficie base de tarjetas y contenedores. Sombra suave tintada con el azul
// institucional: da profundidad sin ensuciar. En oscuro se apaga a una sombra
// negra mínima, porque el contraste lo marcan los bordes.
export const CLASE_TARJETA =
  'rounded-2xl border border-sena-linea bg-white shadow-[0_1px_2px_rgba(0,48,77,0.06),0_14px_30px_-20px_rgba(0,48,77,0.45)] dark:border-sena-borde/70 dark:bg-sena-superficie dark:shadow-[0_1px_2px_rgba(0,0,0,0.4)]'

// Título de sección con la barra verde institucional a la izquierda.
export const CLASE_TITULO_SECCION =
  'border-l-4 border-sena pl-3 text-sm font-semibold text-slate-800 dark:text-sena-texto'

// Tablas.
export const CLASE_TABLA = 'w-full text-left text-sm'
export const CLASE_THEAD =
  'border-b border-sena-linea bg-sena-fondo/60 text-xs font-semibold uppercase tracking-wide text-sena-azul dark:border-sena-borde dark:bg-sena-noche/30 dark:text-sena-texto-suave'
export const CLASE_TBODY = 'divide-y divide-sena-hundido dark:divide-sena-borde'
export const CLASE_TH = 'p-3'
export const CLASE_TD = 'p-3'
export const CLASE_FILA = 'hover:bg-sena-hundido dark:hover:bg-sena-superficie-alta/40'
export const CLASE_TABLA_ESTADO = 'p-8 text-center text-sm text-slate-500 dark:text-sena-texto-suave'
