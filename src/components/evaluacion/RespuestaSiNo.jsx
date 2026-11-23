import { useId } from 'react'
import { IconoX } from '../convocatorias/Iconos'
import Icono from '../ui/Icono'
import Rueda from '../ui/Rueda'
import { CLASE_OPCION_ELEGIDA, CLASE_OPCION_RADIO } from '../../lib/estilos'

// Color de la opción ELEGIDA, con el mismo significado que en el resto del sistema: la afirmativa en verde (como la fila
// elegida y las etiquetas «Pasa a selección») y la negativa en rojo (como «No pasa»). El icono acompaña al color: no
// depende de él. La base común de las opciones vive en CLASE_OPCION_RADIO (lib/estilos.js).
const ELEGIDA_SI = CLASE_OPCION_ELEGIDA
const ELEGIDA_NO =
  'peer-checked:border-red-800 peer-checked:bg-red-800 peer-checked:text-white dark:peer-checked:border-red-900 dark:peer-checked:bg-red-900 dark:peer-checked:text-white'

// Pareja de opciones de una pregunta de dos respuestas. Son botones de radio nativos: el navegador ya da la selección
// expuesta (checked), el recorrido con flechas y el agrupamiento. La opción elegida va rellena y con su icono: no depende
// del color. 'valor' es true, false o undefined (sin responder: ninguna opción marcada).
//  - Por defecto es «Sí / No» (preguntas que registran un hecho: «¿Declaras «X»?»). Para evaluar un requisito se pasan
//    'textoSi' y 'textoNo' («Cumple» / «No cumple»).
//  - 'pregunta' (opcional) reemplaza el texto de lectores de pantalla («¿Cumple «X»?»); 'ayudaId' apunta al texto que
//    explica por qué una opción está bloqueada; 'deshabilitadoSi' y 'deshabilitadoNo' bloquean cada opción por separado
//    (p. ej. no se puede marcar «Cumple» un documento que el aspirante no ha cargado).
//  - 'ocupado': el cambio se está guardando. Las opciones NO se deshabilitan (un radio deshabilitado pierde el foco y
//    quien navega con teclado se quedaría sin lugar): se marcan con aria-busy, se ignoran los cambios mientras dure y
//    no se mueven ni reaccionan al puntero. La rueda va en la opción que se aplica (la contraria a la marcada), que se
//    ve entera; la otra queda atenuada.
export default function RespuestaSiNo({
  requisito,
  pregunta,
  valor,
  onChange,
  textoSi = 'Sí',
  textoNo = 'No',
  ayudaId,
  deshabilitadoSi = false,
  deshabilitadoNo = false,
  ocupado = false,
  className = '',
}) {
  const nombre = useId()
  const opciones = [
    { valor: true, texto: textoSi, icono: <Icono nombre="check" className="size-4" />, elegida: ELEGIDA_SI },
    { valor: false, texto: textoNo, icono: <IconoX className="size-4" />, elegida: ELEGIDA_NO },
  ]

  return (
    <fieldset
      aria-describedby={ayudaId}
      aria-busy={ocupado || undefined}
      className={`grid min-w-0 grid-cols-2 gap-2 @min-[36rem]:flex ${className}`.trim()}
    >
      <legend className="sr-only">{pregunta ?? `¿Cumple «${requisito}»?`}</legend>
      {opciones.map((opcion) => {
        // Mientras guarda, la opción que se aplica es la que aún NO está marcada.
        const aplicando = ocupado && valor !== opcion.valor
        return (
          <label key={String(opcion.valor)} className="relative">
            <input
              type="radio"
              name={nombre}
              checked={valor === opcion.valor}
              onChange={() => {
                if (!ocupado) onChange(opcion.valor)
              }}
              disabled={opcion.valor ? deshabilitadoSi : deshabilitadoNo}
              aria-busy={ocupado || undefined}
              className="peer sr-only"
            />
            <span
              className={`${CLASE_OPCION_RADIO} w-full ${opcion.elegida} ${
                ocupado ? (aplicando ? '' : 'opacity-60') : 'peer-disabled:opacity-50'
              }`}
            >
              {aplicando ? <Rueda /> : opcion.icono}
              {opcion.texto}
            </span>
          </label>
        )
      })}
    </fieldset>
  )
}
