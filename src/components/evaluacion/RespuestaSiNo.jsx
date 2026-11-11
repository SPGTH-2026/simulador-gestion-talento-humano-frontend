import { useId } from 'react'
import { IconoX } from '../convocatorias/Iconos'
import Icono from '../ui/Icono'

const OPCIONES = [
  { valor: true, texto: 'Sí', icono: <Icono nombre="check" className="size-4" /> },
  { valor: false, texto: 'No', icono: <IconoX className="size-4" /> },
]

// Sí / No de un requisito. Son botones de radio nativos: el navegador ya da la
// selección expuesta (checked), el recorrido con flechas y el agrupamiento. La
// opción elegida va rellena y con su icono: no depende del color. 'valor' es
// true, false o undefined (sin responder: ninguna opción marcada).
export default function RespuestaSiNo({ requisito, valor, onChange, className = '' }) {
  const nombre = useId()

  return (
    <fieldset className={`grid min-w-0 grid-cols-2 gap-2 @min-[36rem]:flex ${className}`.trim()}>
      <legend className="sr-only">¿Cumple «{requisito}»?</legend>
      {OPCIONES.map((opcion) => (
        <label key={opcion.texto} className="relative">
          <input
            type="radio"
            name={nombre}
            checked={valor === opcion.valor}
            onChange={() => onChange(opcion.valor)}
            className="peer sr-only"
          />
          <span className="inline-flex min-h-11 w-full min-w-20 cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-sena-azul/60 px-4 text-sm font-semibold text-sena-azul transition-colors hover:bg-sena-cielo/30 peer-checked:border-sena-azul peer-checked:bg-sena-azul peer-checked:text-white peer-focus-visible:ring-2 peer-focus-visible:ring-sena peer-focus-visible:ring-offset-2 motion-reduce:transition-none dark:border-sena-texto-suave/70 dark:text-sena-texto dark:hover:bg-sena-superficie-alta dark:peer-checked:border-sena-texto dark:peer-checked:bg-sena-texto dark:peer-checked:text-sena-noche dark:peer-focus-visible:ring-sena-acento dark:peer-focus-visible:ring-offset-sena-superficie">
            {opcion.icono}
            {opcion.texto}
          </span>
        </label>
      ))}
    </fieldset>
  )
}
