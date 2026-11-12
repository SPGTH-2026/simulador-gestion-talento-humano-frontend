import { useEffect, useRef, useState } from 'react'
import { listaConvocatoriasSeleccion } from '../../api/seleccion'
import { mensajeError } from '../../api/mensajeError'
import Boton from '../ui/Boton'
import { MensajeError } from '../ui/Mensaje'
import Rueda from '../ui/Rueda'
import Paginacion from './Paginacion'
import { CLASE_TEXTO_FUERTE, CLASE_TEXTO_PARTIDO, CLASE_TEXTO_SUAVE } from '../../lib/estilos'
import { tituloConvocatoria } from '../../lib/seleccion'

// Navegación entre convocatorias: una lista compacta, no una pila de tarjetas. El nombre es el dato
// principal (hasta dos líneas) y el código, cuando llega, el secundario; el estado y las vacantes viven en
// el encabezado del detalle. Una página del servidor a la vez (nunca se bajan todas para armar un selector);
// una respuesta vencida —por cambiar de página antes de que llegue la anterior— se descarta.
// La convocatoria activa se marca con aria-current y con el relleno sólido del botón de acción del sistema,
// y el foco de teclado se dibuja por fuera con un contorno que se distingue también sobre ese relleno.
export default function ListaConvocatorias({ seleccionadaId, onElegir, className = '' }) {
  const [pagina, setPagina] = useState(1)
  const [estado, setEstado] = useState({ fase: 'cargando', filas: [], meta: null, error: '' })
  const [intento, setIntento] = useState(0)
  const lista = useRef(null)

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

  // La convocatoria activa debe quedar a la vista dentro de la lista (al entrar por URL o al cambiar de página).
  useEffect(() => {
    lista.current?.querySelector('[aria-current="true"]')?.scrollIntoView({ block: 'nearest' })
  }, [estado.filas, seleccionadaId])

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
    <nav
      id="lista-convocatorias"
      aria-labelledby="titulo-convocatorias"
      className={`flex min-h-0 min-w-0 flex-col gap-2 ${className}`.trim()}
    >
      <h2 id="titulo-convocatorias" className={`px-3 text-xs font-semibold tracking-wide uppercase ${CLASE_TEXTO_SUAVE}`}>
        Convocatorias
      </h2>

      {fase === 'error' && (
        <div className="flex flex-col items-start gap-3 px-1">
          <MensajeError>{error}</MensajeError>
          <Boton variante="contorno" tamano="tactil" onClick={reintentar}>
            Reintentar
          </Boton>
        </div>
      )}

      {cargando && !hayFilas && (
        <p role="status" className={`flex items-center gap-2 px-3 py-4 text-sm ${CLASE_TEXTO_SUAVE}`}>
          <Rueda /> Cargando convocatorias…
        </p>
      )}

      {fase === 'listo' && !hayFilas && (
        <div className="flex flex-col gap-1 px-3 py-4">
          <p className={`text-sm font-semibold ${CLASE_TEXTO_FUERTE}`}>Aún no hay convocatorias</p>
          <p className={`text-sm ${CLASE_TEXTO_SUAVE}`}>Aparecerán cuando haya convocatorias en tus fichas.</p>
        </div>
      )}

      {hayFilas && (
        <ul ref={lista} aria-busy={cargando} className={`-mx-1 flex min-h-0 flex-col gap-0.5 overflow-y-auto px-1 py-0.5 ${cargando ? 'opacity-60' : ''}`}>
          {filas.map((c) => {
            const elegida = String(c.id) === String(seleccionadaId)
            return (
              <li key={c.id}>
                <button
                  type="button"
                  aria-current={elegida ? 'true' : undefined}
                  onClick={() => onElegir(c)}
                  className={`flex min-h-11 w-full min-w-0 flex-col items-start justify-center gap-0.5 rounded-lg px-3 py-2 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sena motion-reduce:transition-none ${
                    elegida
                      ? 'bg-sena-oscuro font-semibold text-white dark:bg-sena-acento dark:text-sena-noche'
                      : 'font-medium text-sena-azul hover:bg-sena-hundido dark:text-sena-texto dark:hover:bg-sena-superficie-alta'
                  }`}
                >
                  <span
                    title={tituloConvocatoria(c)}
                    className={`line-clamp-2 text-sm leading-snug ${CLASE_TEXTO_PARTIDO}`}
                  >
                    {tituloConvocatoria(c)}
                  </span>
                  {c.codigo && (
                    <span
                      className={`text-xs tabular-nums ${
                        elegida ? 'text-white/85 dark:text-sena-noche/80' : CLASE_TEXTO_SUAVE
                      }`}
                    >
                      {c.codigo}
                    </span>
                  )}
                </button>
              </li>
            )
          })}
        </ul>
      )}

      {hayFilas && meta && (
        <Paginacion
          meta={meta}
          singular="convocatoria"
          plural="convocatorias"
          etiqueta="Paginación de convocatorias"
          ocupado={cargando}
          onPagina={cambiarPagina}
          className="px-3"
        />
      )}
    </nav>
  )
}
