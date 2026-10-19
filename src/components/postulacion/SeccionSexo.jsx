import { useState } from 'react'
import { guardarSexo } from '../../api/postulacionesDocumentos'
import { mensajeError } from '../../api/mensajeError'

const ESTILO_TARJETA =
  'rounded-lg border border-slate-200 bg-white p-4 dark:border-sena-borde dark:bg-sena-superficie'

const ESTILO_TITULO =
  'border-l-4 border-sena pl-3 text-sm font-semibold text-slate-800 dark:text-sena-texto'

// Solo 'hombre' y 'mujer' (códigos del tema 'sexo' en el backend).
const OPCIONES = [
  { codigo: 'hombre', nombre: 'Masculino' },
  { codigo: 'mujer', nombre: 'Femenino' },
]

const CLASE_OPCION_BASE =
  'rounded border px-4 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40'

// Selector de sexo (doc 33). Se muestra SIEMPRE, pida o no la convocatoria la
// libreta militar. Se guarda en el perfil del usuario (GET/PUT /perfil) y NO
// crea postulación. Se puede cambiar mientras la ventana esté abierta y queda
// prellenado entre postulaciones; cambiarlo no borra archivos.
export default function SeccionSexo({ sexo, editable, onGuardado, onError }) {
  const [enviando, setEnviando] = useState(false)
  const actual = sexo?.codigo ?? ''

  const elegir = async (codigo) => {
    if (!editable || enviando || codigo === actual) return
    setEnviando(true)
    try {
      const nuevo = await guardarSexo(codigo)
      onGuardado?.(nuevo)
    } catch (e) {
      onError?.(mensajeError(e))
    } finally {
      setEnviando(false)
    }
  }

  return (
    <section className={ESTILO_TARJETA}>
      <h2 className={ESTILO_TITULO}>Tus datos</h2>

      <p className="mt-2 text-sm text-slate-600 dark:text-sena-texto-suave">
        Lo usamos solo para saber si te aplica la libreta militar.
      </p>

      <div className="mt-3 flex flex-wrap gap-2">
        {OPCIONES.map((opcion) => {
          const elegida = opcion.codigo === actual
          return (
            <button
              key={opcion.codigo}
              type="button"
              disabled={!editable || enviando}
              aria-pressed={elegida}
              onClick={() => elegir(opcion.codigo)}
              className={`${CLASE_OPCION_BASE} ${
                elegida
                  ? 'border-sena bg-sena-cielo/40 text-sena-azul dark:border-sena dark:bg-sena-superficie-alta dark:text-sena-texto'
                  : 'border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-sena-borde dark:text-sena-texto-suave dark:hover:bg-sena-superficie-alta'
              }`}
            >
              {opcion.nombre}
            </button>
          )
        })}
      </div>

      {!actual && editable && (
        <p className="mt-2 text-xs text-amber-700 dark:text-amber-400">
          Aún no has indicado tu sexo.
        </p>
      )}

      {!editable && (
        <p className="mt-2 text-xs text-slate-500 dark:text-sena-texto-suave">
          La convocatoria no está abierta; ya no puedes cambiar tu sexo aquí.
        </p>
      )}

      {enviando && (
        <p className="mt-2 text-xs text-slate-500 dark:text-sena-texto-suave">Guardando...</p>
      )}
    </section>
  )
}
