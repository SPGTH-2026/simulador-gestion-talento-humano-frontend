import { useId } from 'react'
import { IconoX } from '../convocatorias/Iconos'
import Icono from '../ui/Icono'

// Color de la opción ELEGIDA, con el mismo significado que en el resto del sistema: «Sí» en verde (como la fila elegida
// y las etiquetas «Pasa a selección») y «No» en rojo (como «No pasa»). El icono acompaña al color: no depende de él.
const OPCIONES = [
  {
    valor: true,
    texto: 'Sí',
    icono: <Icono nombre="check" className="size-4" />,
    elegida:
      'peer-checked:border-sena-oscuro peer-checked:bg-sena-oscuro peer-checked:text-white dark:peer-checked:border-sena-acento dark:peer-checked:bg-sena-acento dark:peer-checked:text-sena-noche',
  },
  {
    valor: false,
    texto: 'No',
    icono: <IconoX className="size-4" />,
    elegida:
      'peer-checked:border-red-800 peer-checked:bg-red-800 peer-checked:text-white dark:peer-checked:border-red-900 dark:peer-checked:bg-red-900 dark:peer-checked:text-white',
  },
]

// Base común de las dos opciones. El hover solo actúa sobre la opción NO elegida: antes también aclaraba la elegida y
// su texto blanco se perdía. Al presionar baja a 0,96, como los botones del sistema.
const CLASE_BASE =
  'inline-flex min-h-11 w-full min-w-20 cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-sena-azul/60 px-4 text-sm font-semibold text-sena-azul transition-[color,background-color,border-color,scale] duration-150 peer-active:scale-[0.96] motion-reduce:transition-none motion-reduce:peer-active:scale-100 peer-disabled:cursor-not-allowed peer-disabled:opacity-50 [input:not(:checked,:disabled)+&]:hover:bg-sena-cielo/30 peer-focus-visible:ring-2 peer-focus-visible:ring-sena peer-focus-visible:ring-offset-2 dark:border-sena-texto-suave/70 dark:text-sena-texto dark:[input:not(:checked,:disabled)+&]:hover:bg-sena-superficie-alta dark:peer-focus-visible:ring-sena-acento dark:peer-focus-visible:ring-offset-sena-superficie'

// Sí / No de un requisito. Son botones de radio nativos: el navegador ya da la
// selección expuesta (checked), el recorrido con flechas y el agrupamiento. La
// opción elegida va rellena y con su icono: no depende del color. 'valor' es
// true, false o undefined (sin responder: ninguna opción marcada).
// 'pregunta' (opcional) reemplaza el texto de lectores de pantalla («¿Cumple «X»?»); 'deshabilitadoSi' y
// 'deshabilitadoNo' bloquean cada opción por separado (p. ej. no se puede desmarcar lo que ya está sin marcar).
export default function RespuestaSiNo({
  requisito,
  pregunta,
  valor,
  onChange,
  deshabilitadoSi = false,
  deshabilitadoNo = false,
  className = '',
}) {
  const nombre = useId()

  return (
    <fieldset className={`grid min-w-0 grid-cols-2 gap-2 @min-[36rem]:flex ${className}`.trim()}>
      <legend className="sr-only">{pregunta ?? `¿Cumple «${requisito}»?`}</legend>
      {OPCIONES.map((opcion) => (
        <label key={opcion.texto} className="relative">
          <input
            type="radio"
            name={nombre}
            checked={valor === opcion.valor}
            onChange={() => onChange(opcion.valor)}
            disabled={opcion.valor ? deshabilitadoSi : deshabilitadoNo}
            className="peer sr-only"
          />
          <span className={`${CLASE_BASE} ${opcion.elegida}`}>
            {opcion.icono}
            {opcion.texto}
          </span>
        </label>
      ))}
    </fieldset>
  )
}
