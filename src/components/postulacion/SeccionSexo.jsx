import { useId, useState } from 'react'
import { guardarSexo } from '../../api/postulacionesDocumentos'
import { mensajeError } from '../../api/mensajeError'
import { CLASE_TARJETA, CLASE_TITULO_SECCION } from '../../lib/estilos'
import Rueda from '../ui/Rueda'
import { ID_SECCION_SEXO } from '../../lib/postulacionDocumentos'

const ESTILO_TARJETA = `${CLASE_TARJETA} p-4`

const ESTILO_TITULO = CLASE_TITULO_SECCION

// Solo 'hombre' y 'mujer' (códigos del tema 'sexo' en el backend).
const OPCIONES = [
  { codigo: 'hombre', nombre: 'Masculino' },
  { codigo: 'mujer', nombre: 'Femenino' },
]

// Selector de sexo (doc 33). Se muestra SIEMPRE, pida o no la convocatoria la
// libreta militar. Se guarda en el perfil del usuario (GET/PUT /perfil) y NO
// crea postulación. Se puede cambiar mientras la ventana esté abierta y queda
// prellenado entre postulaciones; cambiarlo no borra archivos.
//
// Es un campo de formulario, no un botón de acción: etiqueta «Sexo» visible, ayuda
// debajo y radios nativos compactos. La opción elegida usa la misma tarjeta
// discreta de las opciones de Selección (borde y anillo verdes sobre fondo suave),
// no el relleno sólido de las acciones. Mientras guarda NO se deshabilita nada (un
// radio deshabilitado pierde el foco del teclado): la opción pedida se ve elegida
// con la rueda, los cambios se ignoran hasta terminar y, si falla, vuelve la
// anterior y se muestra el error.
export default function SeccionSexo({ sexo, editable, onGuardado, onError }) {
  const nombreGrupo = useId()
  const idAyuda = useId()
  // Código que se está guardando (null = nada en curso).
  const [guardando, setGuardando] = useState(null)
  const actual = sexo?.codigo ?? ''
  // Lo que se ve elegido: la opción pedida mientras guarda; si falla, la anterior.
  const visible = guardando ?? actual

  const elegir = async (codigo) => {
    if (!editable || guardando || codigo === actual) return
    setGuardando(codigo)
    try {
      const nuevo = await guardarSexo(codigo)
      onGuardado?.(nuevo)
    } catch (e) {
      onError?.(mensajeError(e))
    } finally {
      setGuardando(null)
    }
  }

  return (
    <section id={ID_SECCION_SEXO} className={`${ESTILO_TARJETA} scroll-mt-24`}>
      <h2 className={ESTILO_TITULO}>Datos del aspirante</h2>

      <fieldset
        aria-describedby={idAyuda}
        aria-busy={guardando ? true : undefined}
        disabled={!editable}
        className="mt-3 min-w-0"
      >
        <legend className="text-sm font-medium text-sena-azul dark:text-sena-texto">Sexo</legend>
        <p id={idAyuda} className="mt-0.5 text-sm text-slate-600 dark:text-sena-texto-suave">
          Este dato se solicita únicamente para determinar si te corresponde presentar la libreta militar.
        </p>

        <div className="mt-2 flex flex-wrap gap-2">
          {OPCIONES.map((opcion) => {
            const elegida = visible === opcion.codigo
            const aplicando = guardando === opcion.codigo
            return (
              <label
                key={opcion.codigo}
                className={`flex min-h-11 items-center gap-2.5 rounded-lg border px-3.5 text-sm font-medium transition-[background-color,border-color,box-shadow] duration-150 has-focus-visible:ring-2 has-focus-visible:ring-sena/60 has-disabled:cursor-not-allowed has-disabled:opacity-60 motion-reduce:transition-none ${
                  guardando ? 'cursor-progress' : 'cursor-pointer'
                } ${
                  elegida
                    ? 'border-sena bg-sena-fondo text-sena-azul ring-1 ring-sena dark:bg-sena-superficie-alta dark:text-sena-texto'
                    : 'border-sena-linea/80 text-slate-700 dark:border-sena-borde/60 dark:text-sena-texto'
                } ${
                  !elegida && !guardando ? 'hover:bg-sena-cielo/30 dark:hover:bg-sena-superficie-alta' : ''
                }`}
              >
                <input
                  type="radio"
                  name={nombreGrupo}
                  checked={elegida}
                  onChange={() => elegir(opcion.codigo)}
                  aria-busy={aplicando || undefined}
                  className="size-4 shrink-0 cursor-[inherit] accent-sena-oscuro dark:accent-sena-acento"
                />
                {opcion.nombre}
                {aplicando && <Rueda />}
              </label>
            )
          })}
        </div>
      </fieldset>

      <div role="status" aria-live="polite">
        {guardando && (
          <p className="mt-2 text-sm text-slate-600 dark:text-sena-texto-suave">Guardando…</p>
        )}
        {!guardando && !actual && editable && (
          <p className="mt-2 text-sm text-amber-700 dark:text-amber-400">
            Dato pendiente: selecciona una opción para continuar.
          </p>
        )}
      </div>

      {!editable && (
        <p className="mt-2 text-sm text-slate-600 dark:text-sena-texto-suave">
          La convocatoria ya no está abierta: este dato no se puede modificar.
        </p>
      )}
    </section>
  )
}
