import { useEffect, useId, useRef, useState } from 'react'
import { listaConvocatoriasSeleccion } from '../../api/seleccion'
import { mensajeError } from '../../api/mensajeError'
import Boton from '../ui/Boton'
import Icono from '../ui/Icono'
import { MensajeError } from '../ui/Mensaje'
import Rueda from '../ui/Rueda'
import Paginacion from '../ui/Paginacion'
import { CLASE_TEXTO_FUERTE, CLASE_TEXTO_PARTIDO, CLASE_TEXTO_SUAVE } from '../../lib/estilos'
import { tituloConvocatoria } from '../../lib/seleccion'

// Navegación entre convocatorias. Cada fila dice lo que el listado ya trae: nombre (hasta dos líneas), estado y
// vacantes; el código, cuando llega, va delante. Una página del servidor a la vez (nunca se bajan todas para armar un
// selector); una respuesta vencida —por cambiar de página antes de que llegue la anterior— se descarta.
//
// En pantallas anchas es una columna siempre visible. En las estrechas se pliega en un solo botón con el nombre de la
// convocatoria activa: así el detalle queda a la vista y, al abrirlo, siguen disponibles todas las páginas.
// La convocatoria activa se marca con aria-current y con el relleno sólido del botón de acción del sistema, y el foco
// de teclado se dibuja por fuera con un contorno que se distingue también sobre ese relleno.
// 'onPaginaCargada' (opcional) avisa que llegó una página del listado: quien la usa sabe entonces si la convocatoria
// de la URL venía en ella y evita pedir sus datos aparte.
export default function ListaConvocatorias({ seleccionadaId, etiquetaSeleccionada, onElegir, onPaginaCargada, className = '' }) {
  const idCuerpo = useId()
  const [pagina, setPagina] = useState(1)
  const [estado, setEstado] = useState({ fase: 'cargando', filas: [], meta: null, error: '' })
  const [intento, setIntento] = useState(0)
  // Solo cuenta en pantallas estrechas: sin convocatoria elegida la lista empieza abierta; con una, plegada.
  const [abierta, setAbierta] = useState(!seleccionadaId)
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
        onPaginaCargada?.()
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
  }, [estado.filas, seleccionadaId, abierta])

  const cambiarPagina = (n) => {
    setEstado((previo) => ({ ...previo, fase: 'cargando', error: '' }))
    setPagina(n)
  }
  const reintentar = () => {
    setEstado((previo) => ({ ...previo, fase: 'cargando', error: '' }))
    setIntento((n) => n + 1)
  }
  const elegir = (c) => {
    setAbierta(false)
    onElegir(c)
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
      <h2
        id="titulo-convocatorias"
        className={`hidden px-3 text-xs font-semibold tracking-wide uppercase @min-[900px]:block ${CLASE_TEXTO_SUAVE}`}
      >
        Convocatorias
      </h2>

      {/* Solo en pantallas estrechas: un botón con la convocatoria activa que despliega la lista. */}
      <button
        type="button"
        aria-expanded={abierta}
        aria-controls={idCuerpo}
        onClick={() => setAbierta((a) => !a)}
        className="flex min-h-11 w-full min-w-0 items-center justify-between gap-3 rounded-lg border border-sena-azul/60 px-3 py-2 text-left transition-colors hover:bg-sena-cielo/30 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sena motion-reduce:transition-none @min-[900px]:hidden dark:border-sena-texto-suave/70 dark:hover:bg-sena-superficie-alta"
      >
        <span className="flex min-w-0 flex-col">
          <span className={`text-xs font-medium ${CLASE_TEXTO_SUAVE}`}>Convocatoria</span>
          <span className={`truncate text-sm font-semibold ${CLASE_TEXTO_FUERTE}`}>
            {seleccionadaId ? (etiquetaSeleccionada ?? `Convocatoria ${seleccionadaId}`) : 'Elige una convocatoria'}
          </span>
        </span>
        <Icono nombre="chevron" className={`size-5 shrink-0 transition-transform motion-reduce:transition-none ${abierta ? 'rotate-180' : ''}`} />
      </button>

      <div id={idCuerpo} className={`flex min-h-0 min-w-0 flex-col gap-2 ${abierta ? '' : '@max-[899px]:hidden'}`}>
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
          <ul
            ref={lista}
            aria-busy={cargando}
            className={`-mx-1 flex max-h-72 min-h-0 flex-col gap-0.5 overflow-y-auto px-1 py-0.5 @min-[900px]:max-h-none ${cargando ? 'opacity-60' : ''}`}
          >
            {filas.map((c) => {
              const elegida = String(c.id) === String(seleccionadaId)
              const vacantes = `${c.vacantes} ${c.vacantes === 1 ? 'vacante' : 'vacantes'}`
              return (
                <li key={c.id}>
                  <button
                    type="button"
                    aria-current={elegida ? 'true' : undefined}
                    onClick={() => elegir(c)}
                    className={`flex min-h-11 w-full min-w-0 flex-col items-start justify-center gap-0.5 rounded-lg px-3 py-1.5 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sena motion-reduce:transition-none ${
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
                    <span
                      className={`text-xs font-normal tabular-nums ${
                        elegida ? 'text-white/85 dark:text-sena-noche/80' : CLASE_TEXTO_SUAVE
                      }`}
                    >
                      {c.codigo ? `${c.codigo} · ` : ''}
                      {c.estado?.nombre ?? c.estado?.codigo} · {vacantes}
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
            singular="convocatoria"
            plural="convocatorias"
            etiqueta="Paginación de convocatorias"
            ocupado={cargando}
            onPagina={cambiarPagina}
            className="px-3"
          />
        )}
      </div>
    </nav>
  )
}
