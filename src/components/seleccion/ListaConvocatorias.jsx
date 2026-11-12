import { useEffect, useState } from 'react'
import { listaConvocatoriasSeleccion } from '../../api/seleccion'
import { mensajeError } from '../../api/mensajeError'
import EtiquetaEstado from '../convocatorias/EtiquetaEstado'
import Boton from '../ui/Boton'
import { MensajeError } from '../ui/Mensaje'
import Rueda from '../ui/Rueda'
import Paginacion from './Paginacion'
import {
  CLASE_CHIP,
  CLASE_TARJETA_PLANA,
  CLASE_TEXTO_FUERTE,
  CLASE_TEXTO_PARTIDO,
  CLASE_TEXTO_SUAVE,
  CLASE_TITULO_SECCION,
} from '../../lib/estilos'
import { tituloConvocatoria } from '../../lib/seleccion'

// Convocatorias de Selección: una página del servidor a la vez (nunca se bajan
// todas para armar un selector). Una respuesta vencida —por cambiar de página
// antes de que llegue la anterior— se descarta.
export default function ListaConvocatorias({ seleccionadaId, onElegir }) {
  const [pagina, setPagina] = useState(1)
  const [estado, setEstado] = useState({ fase: 'cargando', filas: [], meta: null, error: '' })
  const [intento, setIntento] = useState(0)

  useEffect(() => {
    let vigente = true
    listaConvocatoriasSeleccion({ page: pagina })
      .then((res) => {
        if (!vigente) return
        setEstado({ fase: 'listo', filas: res.data, meta: res.meta, error: '' })
        // Con una convocatoria en la URL, sus datos se completan en cuanto aparece en la página.
        const elegida = res.data.find((c) => String(c.id) === String(seleccionadaId))
        if (elegida) onElegir(elegida, { silencioso: true })
      })
      .catch((e) => {
        if (vigente) setEstado((previo) => ({ ...previo, fase: 'error', error: mensajeError(e) }))
      })
    return () => {
      vigente = false
    }
    // 'seleccionadaId' y 'onElegir' solo se leen al llegar la respuesta; no deben repetir la consulta.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagina, intento])

  const cambiarPagina = (n) => {
    setEstado((previo) => ({ ...previo, fase: 'cargando', error: '' }))
    setPagina(n)
  }
  const reintentar = () => {
    setEstado((previo) => ({ ...previo, fase: 'cargando', error: '' }))
    setIntento((n) => n + 1)
  }

  const { fase, filas, meta, error } = estado
  const cargando = fase === 'cargando'
  const hayFilas = filas.length > 0

  return (
    <section aria-labelledby="titulo-convocatorias" className={`${CLASE_TARJETA_PLANA} flex min-w-0 flex-col gap-4 p-4`}>
      <h2 id="titulo-convocatorias" className={CLASE_TITULO_SECCION}>
        Convocatorias
      </h2>

      {fase === 'error' && (
        <div className="flex flex-col items-start gap-3">
          <MensajeError>{error}</MensajeError>
          <Boton variante="contorno" tamano="tactil" onClick={reintentar}>
            Reintentar
          </Boton>
        </div>
      )}

      {cargando && !hayFilas && (
        <p role="status" className={`flex items-center gap-2 py-6 text-sm ${CLASE_TEXTO_SUAVE}`}>
          <Rueda /> Cargando convocatorias…
        </p>
      )}

      {fase === 'listo' && !hayFilas && (
        <div className="flex flex-col gap-1 py-6 text-center">
          <p className={`text-sm font-semibold ${CLASE_TEXTO_FUERTE}`}>Aún no hay convocatorias</p>
          <p className={`text-sm ${CLASE_TEXTO_SUAVE}`}>
            Aparecerán aquí cuando haya convocatorias publicadas en tus fichas.
          </p>
        </div>
      )}

      {hayFilas && (
        <ul aria-busy={cargando} className={`flex flex-col gap-2 ${cargando ? 'opacity-60' : ''}`}>
          {filas.map((c) => {
            const elegida = String(c.id) === String(seleccionadaId)
            return (
              <li key={c.id}>
                <button
                  type="button"
                  aria-pressed={elegida}
                  onClick={() => onElegir(c)}
                  className={`flex min-h-11 w-full min-w-0 flex-col items-start gap-1.5 rounded-xl border p-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sena/40 motion-reduce:transition-none ${
                    elegida
                      ? 'border-sena bg-sena-fondo ring-1 ring-sena dark:bg-sena-superficie-alta'
                      : 'border-sena-linea/80 hover:bg-sena-fondo/60 dark:border-sena-borde/60 dark:hover:bg-sena-superficie-alta/40'
                  }`}
                >
                  <span className={`text-sm font-semibold ${CLASE_TEXTO_PARTIDO} ${CLASE_TEXTO_FUERTE}`}>
                    {tituloConvocatoria(c)}
                  </span>
                  <span className="flex flex-wrap items-center gap-2">
                    <EtiquetaEstado codigo={c.estado?.codigo} nombre={c.estado?.nombre} />
                    {c.codigo && <span className={CLASE_CHIP}>{c.codigo}</span>}
                    <span className={`text-xs ${CLASE_TEXTO_SUAVE}`}>
                      {c.vacantes} {c.vacantes === 1 ? 'vacante' : 'vacantes'}
                    </span>
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      )}

      {hayFilas && meta && (
        <Paginacion
          meta={meta}
          unidad="convocatoria(s)"
          etiqueta="Paginación de convocatorias"
          ocupado={cargando}
          onPagina={cambiarPagina}
        />
      )}
    </section>
  )
}
