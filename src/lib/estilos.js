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

// Variante plana de la tarjeta: mismo borde, radio y superficie, sin la sombra
// alta. Se usa en rejillas densas de datos y en cajas repetidas, donde la
// sombra competiría con la tarjeta que las contiene.
export const CLASE_TARJETA_PLANA =
  'rounded-2xl border border-sena-linea bg-white dark:border-sena-borde/70 dark:bg-sena-superficie'

// Caja interior suave: separa un bloque dentro de una tarjeta sin abrir otra
// superficie blanca. En oscuro baja a sena-noche para no competir con la
// tarjeta. No incluye padding: lo define cada uso.
export const CLASE_CAJA_SUAVE =
  'rounded-xl border border-sena-linea/70 bg-sena-fondo/50 dark:border-sena-borde/50 dark:bg-sena-noche/40'

// Par etiqueta/valor de una tarjeta de dato. La etiqueta va a 12 px (mínimo de
// las micro-etiquetas) y el valor a 14 px, el mínimo del contenido.
export const CLASE_META_DT = 'text-xs font-medium text-slate-500 dark:text-sena-texto-suave'
export const CLASE_META_DD = 'mt-0.5 text-sm font-semibold text-slate-800 dark:text-sena-texto'

// Encabezado de página. El título usa el azul institucional y el subtítulo se
// mantiene en 14 px; no se baja a 12 px porque es contenido, no una etiqueta.
export const CLASE_TITULO_PAGINA =
  'text-2xl font-bold tracking-tight text-sena-azul dark:text-sena-texto sm:text-3xl'
export const CLASE_SUBTITULO_PAGINA = 'mt-1 text-sm text-slate-600 dark:text-sena-texto-suave'

// Chip informativo para metadatos cortos (modalidad, tipo de contrato, área).
// No es interactivo: por eso no lleva hover ni foco.
export const CLASE_CHIP =
  'inline-flex items-center gap-1 rounded-full border border-sena-linea/70 bg-sena-fondo px-2.5 py-1 text-xs font-medium text-sena-azul dark:border-sena-borde/50 dark:bg-sena-noche/40 dark:text-sena-texto-suave'

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
