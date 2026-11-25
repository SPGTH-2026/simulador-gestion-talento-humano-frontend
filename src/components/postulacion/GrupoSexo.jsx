import { useId } from 'react'
import { OPCIONES_SEXO } from '../../lib/datosPersonales'

// Selector de sexo del formulario de datos personales. Es un campo de formulario (radios nativos), con la misma tarjeta
// discreta de las opciones de Selección: borde y anillo verdes sobre fondo suave para la elegida.
export default function GrupoSexo({ valor, onCambio, deshabilitado, error }) {
  const nombreGrupo = useId()
  const idAyuda = useId()

  return (
    <fieldset aria-describedby={idAyuda} disabled={deshabilitado} className="min-w-0">
      <legend className="text-sm font-medium text-sena-azul dark:text-sena-texto">Sexo *</legend>
      <p id={idAyuda} className="mt-0.5 text-sm text-slate-600 dark:text-sena-texto-suave">
        Se usa para saber si te corresponde presentar la libreta militar.
      </p>

      <div className="mt-2 flex flex-wrap gap-2">
        {OPCIONES_SEXO.map((opcion) => {
          const elegida = valor === opcion.codigo
          return (
            <label
              key={opcion.codigo}
              className={`flex min-h-11 cursor-pointer items-center gap-2.5 rounded-lg border px-3.5 text-sm font-medium transition-[background-color,border-color,box-shadow] duration-150 has-focus-visible:ring-2 has-focus-visible:ring-sena/60 has-disabled:cursor-not-allowed has-disabled:opacity-60 motion-reduce:transition-none ${
                elegida
                  ? 'border-sena bg-sena-fondo text-sena-azul ring-1 ring-sena dark:bg-sena-superficie-alta dark:text-sena-texto'
                  : 'border-sena-linea/80 text-slate-700 hover:bg-sena-cielo/30 dark:border-sena-borde/60 dark:text-sena-texto dark:hover:bg-sena-superficie-alta'
              }`}
            >
              <input
                type="radio"
                name={nombreGrupo}
                checked={elegida}
                onChange={() => onCambio(opcion.codigo)}
                className="size-4 shrink-0 cursor-[inherit] accent-sena-oscuro dark:accent-sena-acento"
              />
              {opcion.nombre}
            </label>
          )
        })}
      </div>
      {error && (
        <p role="alert" className="mt-1 text-sm font-medium text-peligro">
          {error}
        </p>
      )}
    </fieldset>
  )
}
