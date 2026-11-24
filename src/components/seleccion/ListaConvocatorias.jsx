import { useEffect, useId, useRef, useState } from 'react'
import { listaConvocatoriasSeleccion } from '../../api/seleccion'
import { mensajeError } from '../../api/mensajeError'
import Boton from '../ui/Boton'
import Campo from '../ui/Campo'
import Icono from '../ui/Icono'
import { MensajeError } from '../ui/Mensaje'
import { EsqueletoLista } from '../ui/Esqueleto'
import Paginacion from '../ui/Paginacion'
import { CLASE_CAMPO, CLASE_TARJETA_PLANA, CLASE_TEXTO_FUERTE, CLASE_TEXTO_PARTIDO, CLASE_TEXTO_SUAVE } from '../../lib/estilos'
import { ESTADOS_FILTRO, textoCandidatos, tituloConvocatoria } from '../../lib/seleccion'

// Navegación entre convocatorias. Cada fila dice lo que el listado ya trae: nombre (hasta dos líneas), estado y
// vacantes; el código, cuando llega, va delante. Una página del servidor a la vez (nunca se bajan todas para armar un
// selector); una respuesta vencida —por cambiar de página antes de que llegue la anterior— se descarta.
//
// En pantallas anchas es una columna siempre visible. En las estrechas se pliega en un solo botón con el nombre de la
// convocatoria activa: así el detalle queda a la vista y, al abrirlo, siguen disponibles todas las páginas.
// Las filas van dentro de una tarjeta plana (mismo borde y superficie que el resto del sistema): sin ella las no elegidas flotaban
// sobre el fondo y no se distinguían como lista. El relleno de 4 px de la tarjeta deja sitio al contorno del foco (2 px + 2 px de
// separación), que si no se recortaría contra el borde de la zona con desplazamiento.
// La convocatoria activa se marca con aria-current y con el relleno sólido del botón de acción del sistema, y el foco
// de teclado se dibuja por fuera con un contorno que se distingue también sobre ese relleno.
// 'onFiltroEstado' (opcional) activa el filtro de estado (siempre visible, también con la lista plegada en móvil), con el mismo patrón de los demás listados (un campo con su
// etiqueta y un selector «Todos los estados»): 'filtroEstado' es '' o un código de ESTADOS_FILTRO y el padre lo guarda
// (en la URL). Al cambiarlo se vuelve a la primera página y, hasta que llega la respuesta de ese filtro, no se muestran
// las filas de la consulta anterior.
export default function ListaConvocatorias({
  seleccionadaId,
  etiquetaSeleccionada,
  onElegir,
  filtroEstado = '',
  onFiltroEstado,
  codigoEstadoSeleccionada,
  className = '',
}) {
  const idCuerpo = useId()
  const [pagina, setPagina] = useState(1)
  // 'filtro' es el filtro con el que se pidieron las filas guardadas: si ya no coincide con el actual, esas filas son de
  // otra consulta y no se muestran.
  const [estado, setEstado] = useState({ fase: 'cargando', filas: [], meta: null, error: '', filtro: filtroEstado })
  const [intento, setIntento] = useState(0)
  // Solo cuenta en pantallas estrechas: sin convocatoria elegida la lista empieza abierta; con una, plegada.
  const [abierta, setAbierta] = useState(!seleccionadaId)
  const lista = useRef(null)
  const boton = useRef(null)
  // Al cambiar el filtro (también desde la URL: atrás/adelante) se vuelve a la primera página.
  const [filtroPrevio, setFiltroPrevio] = useState(filtroEstado)
  if (filtroPrevio !== filtroEstado) {
    setFiltroPrevio(filtroEstado)
    setPagina(1)
  }

  useEffect(() => {
    let vigente = true
    listaConvocatoriasSeleccion({ page: pagina, ...(filtroEstado && { estado: filtroEstado }) })
      .then((res) => {
        if (!vigente) return
        setEstado({ fase: 'listo', filas: res.data, meta: res.meta, error: '', filtro: filtroEstado })
      })
      .catch((e) => {
        if (vigente) setEstado((previo) => ({ ...previo, fase: 'error', error: mensajeError(e) }))
      })
    return () => {
      vigente = false
    }
  }, [pagina, intento, filtroEstado])

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
  // En pantallas estrechas la lista se pliega al elegir o con Escape: el foco vuelve al botón «Convocatoria» (lo único visible) en vez
  // de perderse en la página. Con la lista siempre visible (ancho) el botón no se ve y el foco se queda en la fila.
  const plegar = () => {
    setAbierta(false)
    if (boton.current?.offsetParent) boton.current.focus()
  }
  const elegir = (c) => {
    plegar()
    onElegir(c)
  }

  const { fase, meta, error } = estado
  // Las filas de otro filtro no se muestran como si fueran el resultado del actual: se espera la respuesta vigente.
  const filtroVigente = estado.filtro === filtroEstado
  const filas = filtroVigente ? estado.filas : []
  const cargando = fase === 'cargando' || !filtroVigente
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

      {/* Dos controles con funciones distintas y la MISMA presentación (etiqueta visible encima, caja de 44 px, mismo borde y tipografía):
          «Estado» es un selector que filtra la lista (siempre visible, también con la lista plegada en móvil) y «Convocatoria» es un
          botón que despliega la lista (solo en pantallas estrechas). El filtro no cambia lo que cada estado permite hacer. */}
      {onFiltroEstado && (
        <Campo etiqueta="Estado" className="px-1 @min-[480px]:max-w-72">
          <select
            value={filtroEstado}
            onChange={(e) => {
              // En móvil la lista puede estar plegada: al filtrar se abre para ver el resultado.
              setAbierta(true)
              onFiltroEstado(e.target.value)
            }}
            className={CLASE_CAMPO}
          >
            <option value="">Todos los estados</option>
            {ESTADOS_FILTRO.map((e) => (
              <option key={e.codigo} value={e.codigo}>
                {e.nombre}
              </option>
            ))}
          </select>
        </Campo>
      )}

      <Campo etiqueta="Convocatoria" className="px-1 @min-[900px]:hidden">
        {({ id }) => (
          <button
            id={id}
            ref={boton}
            type="button"
            aria-expanded={abierta}
            aria-controls={idCuerpo}
            onClick={() => setAbierta((a) => !a)}
            className={`${CLASE_CAMPO} flex w-full min-w-0 items-center justify-between gap-3 text-left transition-colors hover:bg-sena-cielo/30 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sena motion-reduce:transition-none dark:hover:bg-sena-superficie-alta`}
          >
            <span className="truncate">
              {seleccionadaId ? (etiquetaSeleccionada ?? `Convocatoria ${seleccionadaId}`) : 'Elige una convocatoria'}
            </span>
            <Icono nombre="chevron" className={`size-5 shrink-0 transition-transform motion-reduce:transition-none ${abierta ? 'rotate-180' : ''}`} />
          </button>
        )}
      </Campo>

      {/* La convocatoria abierta se conserva aunque el filtro no la incluya: solo se avisa, sin cerrarla ni cambiar nada. */}
      {filtroEstado && codigoEstadoSeleccionada && codigoEstadoSeleccionada !== filtroEstado && (
        <p className={`px-3 text-xs ${CLASE_TEXTO_SUAVE}`}>
          La convocatoria abierta no coincide con este filtro. Sigue abierta; elige «Todos los estados» para verla en la lista.
        </p>
      )}

      <div
        id={idCuerpo}
        onKeyDown={(e) => {
          if (e.key === 'Escape' && abierta && boton.current?.offsetParent) {
            e.stopPropagation()
            plegar()
          }
        }}
        className={`flex min-h-0 min-w-0 flex-col gap-2 ${abierta ? '' : '@max-[899px]:hidden'}`}
      >
        {fase === 'error' && (
          <div className="flex flex-col items-start gap-3 px-1">
            <MensajeError>{error}</MensajeError>
            <Boton variante="contorno" tamano="tactil" onClick={reintentar}>
              Reintentar
            </Boton>
          </div>
        )}

        {/* Filas de dos líneas dentro de la tarjeta de la lista y el pie de paginación reservado: la tarjeta se recorta al alto del
              área (max-h del contenedor), así que ni genera scroll ni rellena la página. */}
        {cargando && !hayFilas && fase !== 'error' && (
          <EsqueletoLista texto="Cargando convocatorias…" filas={10} tarjeta pie textoPie="Cargando convocatorias…" listaClassName="max-h-72 @min-[900px]:max-h-none" />
        )}

        {fase === 'listo' && filtroVigente && !hayFilas && (
          <div className="flex flex-col gap-1 px-3 py-4">
            <p className={`text-sm font-semibold ${CLASE_TEXTO_FUERTE}`}>
              {filtroEstado ? 'Ninguna convocatoria con ese estado' : 'Aún no hay convocatorias'}
            </p>
            <p className={`text-sm ${CLASE_TEXTO_SUAVE}`}>
              {filtroEstado
                ? 'Elige «Todos los estados» para ver todas las de tus fichas.'
                : 'Aparecerán cuando haya convocatorias en tus fichas.'}
            </p>
          </div>
        )}

        {hayFilas && (
          <ul
            ref={lista}
            aria-busy={cargando}
            className={`${CLASE_TARJETA_PLANA} flex max-h-72 min-h-0 flex-col gap-0.5 overflow-y-auto p-1 @min-[900px]:max-h-none ${cargando ? 'opacity-60' : ''}`}
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
                      {c.candidatos != null && ` · ${textoCandidatos(c.candidatos)}`}
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
