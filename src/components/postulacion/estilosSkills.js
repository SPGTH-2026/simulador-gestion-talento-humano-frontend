import { CLASE_TARJETA, CLASE_TITULO_SECCION } from '../../lib/estilos'

// Estilos y textos compartidos por la sección de skills y sus filas.
export const ESTILO_TARJETA = `${CLASE_TARJETA} p-4`

export const ESTILO_TITULO = CLASE_TITULO_SECCION

export const ESTILO_GRUPO =
  'text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-sena-texto-suave'

export const CLASE_ETIQUETA =
  'rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600 dark:bg-sena-superficie-alta dark:text-sena-texto-suave'

export const CLASE_CERTIFICADA =
  'rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'

export const origenTexto = (origen) =>
  origen === 'convocatoria'
    ? 'De la convocatoria'
    : origen === 'catalogo'
      ? 'Del catálogo'
      : 'Propia'

// Una fila de skill, en dos renglones para que las acciones no se amontonen:
//  1. nombre + etiquetas, y a la derecha el interruptor de declarar (las filas de solo lectura NO lo tienen).
//  2. cuando está declarada, el certificado: a la izquierda su estado/nombre y a la derecha sus acciones
//     (Ver, Reemplazar, Quitar o Cargar certificado), siempre visibles.
//
// `sinSiNo` marca las filas que NO se pueden marcar ni desmarcar: son las
// declaradas antes del cambio (del catálogo o propias). Se muestran tal cual,
// con la nota "declaradas antes", sin editar ni borrar.
