import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../auth/useAuth'
import { listaEvaluaciones } from '../../api/evaluaciones'
import { mensajeError } from '../../api/mensajeError'
import {
  IconoFlechaDerecha,
  IconoFlechaIzquierda,
  IconoLupa,
  IconoOjo,
  IconoX,
} from '../../components/convocatorias/Iconos'
import {
  DatosAspirante,
  EtiquetaEvaluacion,
  Cumplimiento,
  Resultado,
} from '../../components/evaluacion/PresentacionEvaluacion'
import Boton from '../../components/ui/Boton'
import Campo from '../../components/ui/Campo'
import Etiqueta from '../../components/ui/Etiqueta'
import Icono from '../../components/ui/Icono'
import { MensajeError } from '../../components/ui/Mensaje'
import {
  CLASE_CAMPO,
  CLASE_SUBTITULO_PAGINA,
  CLASE_TARJETA_PLANA,
  CLASE_TBODY,
  CLASE_TEXTO_FUERTE,
  CLASE_TEXTO_PARTIDO,
  CLASE_TEXTO_SUAVE,
  CLASE_THEAD,
  CLASE_TITULO_PAGINA,
} from '../../lib/estilos'

// Fondo de fila al pasar el cursor: el más claro que mantiene las etiquetas
// verdes sobre 4.5:1 (sena-hundido las dejaba en 4.1:1).
const CLASE_FILA =
  'transition-colors hover:bg-sena-fondo/60 focus-within:bg-sena-fondo/60 motion-reduce:transition-none dark:hover:bg-sena-superficie-alta/40 dark:focus-within:bg-sena-superficie-alta/40'

// Los encabezados no se parten: el ancho de las columnas pequeñas se fija en
// el <colgroup> para que ninguno se corte ni invada a su vecino.
const CLASE_TH = 'whitespace-nowrap px-3 py-3 first:pl-4 last:pr-4'
const CLASE_TD = 'px-3 py-3.5 align-middle first:pl-4 last:pr-4'

// Tono de la etiqueta del estado de postulación; un estado que no está aquí
// cae al neutro.
const TONO_POSTULACION = {
  Postulado: 'azul',
  'En evaluación': 'azul',
  'En revisión': 'aviso',
  'Documentación validada': 'exito',
  Seleccionado: 'exito',
}

const nombreDe = (fila) => fila.aspirante.name ?? 'aspirante'

// Barra de documentos: gris sin documentos o sin ninguno cargado, ámbar con
// avance parcial y verde con todos. El texto "x/y" acompaña siempre a la
// barra: el color nunca es el único canal. El backend cuenta como 'cargados' los
// documentos que el aspirante subió (antes 'validados'): el contrato no trae
// validación documental, así que aquí se rotulan como subidos.
function ProgresoDocumentos({ fila }) {
  const docs = fila.documentos ?? {}
  const total = docs.total ?? 0
  const subidos = docs.cargados ?? docs.validados ?? 0
  const maximo = Math.max(total, 1)
  const pct = Math.min(100, Math.round((subidos / maximo) * 100))
  const relleno =
    total === 0 || subidos === 0
      ? 'bg-slate-400 dark:bg-sena-texto-suave'
      : subidos === total
        ? 'bg-exito'
        : 'bg-aviso'

  return (
    <div className="flex items-center gap-2.5">
      <div
        role="progressbar"
        aria-label={`Documentos de ${nombreDe(fila)}`}
        aria-valuemin={0}
        aria-valuemax={maximo}
        aria-valuenow={Math.min(subidos, maximo)}
        aria-valuetext={`${subidos} de ${total} documentos subidos`}
        className="h-2 min-w-10 flex-1 overflow-hidden rounded-full bg-sena-hundido dark:bg-sena-borde"
      >
        <div
          className={`h-full rounded-full transition-[width] duration-300 motion-reduce:transition-none ${relleno}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span
        className={`whitespace-nowrap text-sm font-medium tabular-nums ${CLASE_TEXTO_FUERTE}`}
        aria-hidden="true"
      >
        {subidos}/{total}
      </span>
    </div>
  )
}

// Convocatoria y estado de postulación. Los estados del backend pueden ser
// largos ("Documentación validada"): en una columna estrecha la etiqueta se
// parte en dos líneas en lugar de salirse.
function Convocatoria({ fila, tamanoTexto = '' }) {
  const estado = fila.estado === 'postulado' ? 'Postulado' : fila.estado
  return (
    <div className="flex min-w-0 flex-col items-start gap-1.5">
      <p className={`${tamanoTexto} font-medium ${CLASE_TEXTO_PARTIDO} ${CLASE_TEXTO_FUERTE}`}>
        {fila.convocatoria.titulo}
      </p>
      {estado && (
        <Etiqueta tono={TONO_POSTULACION[estado] ?? 'neutral'} className="max-w-full">
          {estado}
        </Etiqueta>
      )}
    </div>
  )
}

function EnlaceRevisar({ fila, variante, className, children }) {
  return (
    <Boton
      as={Link}
      to={`/evaluacion/evaluar/${fila.id}`}
      aria-label={`Revisar a ${nombreDe(fila)}`}
      variante={variante}
      tamano="tactil"
      className={className}
    >
      {children}
    </Boton>
  )
}

function FilaTabla({ fila }) {
  return (
    <tr className={CLASE_FILA}>
      <td className={CLASE_TD}>
        <DatosAspirante aspirante={fila.aspirante} tamano="sm" />
      </td>
      <td className={CLASE_TD}>
        <Convocatoria fila={fila} />
      </td>
      <td className={CLASE_TD}>
        <ProgresoDocumentos fila={fila} />
      </td>
      <td className={CLASE_TD}>
        <Cumplimiento evaluacion={fila.evaluacion} />
      </td>
      <td className={CLASE_TD}>
        <div className="flex flex-col items-start gap-1.5">
          <EtiquetaEvaluacion evaluacion={fila.evaluacion} />
          <Resultado evaluacion={fila.evaluacion} />
        </div>
      </td>
      <td className={`${CLASE_TD} text-right`}>
        <EnlaceRevisar fila={fila} variante="contorno">
          Revisar
        </EnlaceRevisar>
      </td>
    </tr>
  )
}

function TarjetaAspirante({ fila }) {
  return (
    <li className={`${CLASE_TARJETA_PLANA} flex min-w-0 flex-col gap-4 p-4`}>
      <DatosAspirante aspirante={fila.aspirante} tamano="md" />
      <Convocatoria fila={fila} tamanoTexto="text-sm" />

      <dl className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-6 gap-y-3 border-t border-sena-linea/70 pt-4 dark:border-sena-borde/50">
        <div className="min-w-0">
          <dt className={`mb-1 text-xs font-medium ${CLASE_TEXTO_SUAVE}`}>Documentos subidos</dt>
          <dd>
            <ProgresoDocumentos fila={fila} />
          </dd>
        </div>
        <div className="text-right">
          <dt className={`mb-1 text-xs font-medium ${CLASE_TEXTO_SUAVE}`}>Cumplimiento</dt>
          <dd>
            <Cumplimiento evaluacion={fila.evaluacion} />
          </dd>
        </div>
        <div className="col-span-2 flex flex-wrap items-center gap-2">
          <dt className="sr-only">Evaluación</dt>
          <dd className="flex flex-wrap items-center gap-2">
            <EtiquetaEvaluacion evaluacion={fila.evaluacion} />
            <Resultado evaluacion={fila.evaluacion} />
          </dd>
        </div>
      </dl>

      <EnlaceRevisar fila={fila} variante="primario" className="mt-auto w-full">
        <IconoOjo className="h-4 w-4" />
        Revisar
      </EnlaceRevisar>
    </li>
  )
}

// Marcador gris que respira mientras llegan los datos (quieto con movimiento
// reducido).
function Hueco({ className = '' }) {
  return (
    <span
      className={`block rounded bg-sena-hundido motion-safe:animate-pulse dark:bg-sena-superficie-alta ${className}`}
    />
  )
}

function HuecoPersona({ avatar, className = '' }) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <Hueco className={`${avatar} shrink-0 rounded-full`} />
      <div className="flex-1 space-y-2">
        <Hueco className="h-3 w-3/4" />
        <Hueco className="h-2.5 w-1/2" />
      </div>
    </div>
  )
}

// Estado de carga cuando no hay filas que conservar: la carga inicial o una
// búsqueda sobre una lista vacía. Reserva el mismo espacio que la tabla o las
// tarjetas para que el contenido no salte al llegar. 'texto' es lo que anuncia
// el lector de pantalla.
function EsqueletoListado({ texto }) {
  return (
    <div role="status">
      <span className="sr-only">{texto}</span>

      <div className="hidden @min-[940px]:block" aria-hidden="true">
        <div className={`${CLASE_TARJETA_PLANA} overflow-hidden`}>
          <div className="border-b border-sena-linea bg-sena-fondo/60 px-4 py-4 dark:border-sena-borde dark:bg-sena-noche/30">
            <Hueco className="h-3 w-1/3" />
          </div>
          <div className="divide-y divide-sena-hundido dark:divide-sena-borde">
            {Array.from({ length: 6 }, (_, i) => (
              <div key={i} className="flex items-center gap-6 px-4 py-4">
                <HuecoPersona avatar="size-8" className="w-1/4" />
                <Hueco className="h-3 w-1/5" />
                <Hueco className="h-2 w-1/6" />
                <Hueco className="h-4 w-10" />
                <Hueco className="h-5 w-24 rounded-full" />
                <Hueco className="ml-auto h-11 w-24 rounded-lg" />
              </div>
            ))}
          </div>
        </div>
      </div>

      <ul className="grid gap-3 @min-[600px]:grid-cols-2 @min-[940px]:hidden" aria-hidden="true">
        {Array.from({ length: 3 }, (_, i) => (
          <li key={i} className={`${CLASE_TARJETA_PLANA} flex flex-col gap-4 p-4`}>
            <HuecoPersona avatar="size-10" />
            <Hueco className="h-3 w-4/5" />
            <Hueco className="h-2 w-full" />
            <Hueco className="h-11 w-full rounded-lg" />
          </li>
        ))}
      </ul>
    </div>
  )
}

// Campo de filtro con su lista de opciones y la opción "todas".
function FiltroSelect({ etiqueta, valor, onElegir, todas, opciones }) {
  return (
    <Campo etiqueta={etiqueta}>
      <select value={valor} onChange={(e) => onElegir(e.target.value)} className={CLASE_CAMPO}>
        <option value="">{todas}</option>
        {opciones.map((o) => (
          <option key={o.id} value={o.id}>
            {o.texto}
          </option>
        ))}
      </select>
    </Campo>
  )
}

// Chip de un filtro activo: al pulsarlo se quita ese filtro. Es una píldora y
// no un Boton (que es rectangular); mide 44 px de alto.
function ChipFiltro({ tipo, texto, onQuitar }) {
  return (
    <button
      type="button"
      onClick={onQuitar}
      aria-label={`Quitar filtro de ${tipo.toLowerCase()}: ${texto}`}
      className="inline-flex min-h-11 max-w-full items-center gap-2 rounded-full border border-sena-azul/60 bg-sena-fondo px-4 text-sm font-medium text-sena-azul transition-colors hover:bg-sena-cielo/30 motion-reduce:transition-none dark:border-sena-texto-suave/70 dark:bg-sena-noche/40 dark:text-sena-texto dark:hover:bg-sena-superficie-alta"
    >
      <span className="max-w-[14rem] truncate">
        <span className="font-normal">{tipo}: </span>
        {texto}
      </span>
      <IconoX className="h-4 w-4 shrink-0" />
    </button>
  )
}

export default function EvaluacionListado() {
  const { user } = useAuth()
  // El filtro por ficha solo tiene sentido para quienes tienen alcance sobre
  // varias fichas: super admin e instructor. Los aprendices (general/evaluador)
  // solo ven su propia ficha, asi que no se les muestra el selector.
  const puedeFiltrarPorFicha = user?.role === 'super_admin' || user?.role === 'instructor'

  const [filas, setFilas] = useState([])
  const [convocatorias, setConvocatorias] = useState([])
  const [fichas, setFichas] = useState([])
  const [meta, setMeta] = useState({ current_page: 1, last_page: 1, total: 0 })

  const [termino, setTermino] = useState('')
  const [busqueda, setBusqueda] = useState('')
  const [filtroConvocatoria, setFiltroConvocatoria] = useState('')
  const [filtroFicha, setFiltroFicha] = useState('')
  const [pagina, setPagina] = useState(1)
  // Cambia cada cierto tiempo para volver a consultar el avance de los
  // evaluadores sin recargar la página. No es una consulta nueva para el
  // usuario: no muestra esqueleto ni indicador, solo actualiza las filas.
  const [refresco, setRefresco] = useState(0)

  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  // Solo móvil: el panel de ficha y convocatoria arranca plegado.
  const [filtrosAbiertos, setFiltrosAbiertos] = useState(false)

  // Cada cambio de página, búsqueda, ficha o convocatoria es una consulta
  // nueva con su propio número. Se numera al renderizar (sin esperar al efecto)
  // para que no haya un instante con filtros nuevos y la pantalla sin saber que
  // busca. Se compara el número y no los filtros: al volver de B a A, la
  // consulta de A es otra aunque sus filtros coincidan con una ya resuelta.
  const clave = [pagina, busqueda, filtroConvocatoria, filtroFicha].join('|')
  const [solicitada, setSolicitada] = useState({ clave, numero: 0 })
  if (solicitada.clave !== clave) setSolicitada({ clave, numero: solicitada.numero + 1 })
  const { numero } = solicitada
  const [resuelta, setResuelta] = useState(null)

  useEffect(() => {
    const t = setTimeout(() => {
      setBusqueda(termino)
      setPagina(1)
    }, 300)
    return () => clearTimeout(t)
  }, [termino])

  useEffect(() => {
    const actualizar = () => {
      if (document.visibilityState === 'visible') setRefresco((n) => n + 1)
    }
    const intervalo = setInterval(actualizar, 10000)
    document.addEventListener('visibilitychange', actualizar)
    window.addEventListener('focus', actualizar)
    return () => {
      clearInterval(intervalo)
      document.removeEventListener('visibilitychange', actualizar)
      window.removeEventListener('focus', actualizar)
    }
  }, [])

  // Cada ejecución del efecto es una consulta; al cambiar los filtros, o al salir
  // de la pantalla, la limpieza la marca como vencida y su respuesta (datos,
  // totales, opciones de filtro, error o fin de carga) se descarta. Así una
  // respuesta lenta o fuera de orden nunca pisa a la de una consulta más nueva.
  useEffect(() => {
    let vigente = true
    listaEvaluaciones({
      page: pagina,
      search: busqueda || undefined,
      convocatoria_id: filtroConvocatoria || undefined,
      ficha_id: filtroFicha || undefined,
    })
      .then((res) => {
        if (!vigente) return
        setFilas(res.data)
        setMeta(res.meta)
        if (Array.isArray(res.meta?.convocatorias)) setConvocatorias(res.meta.convocatorias)
        if (Array.isArray(res.meta?.fichas)) setFichas(res.meta.fichas)
        setError('')
      })
      .catch((e) => {
        if (vigente) setError(mensajeError(e))
      })
      .finally(() => {
        if (!vigente) return
        setCargando(false)
        setResuelta(numero)
      })

    return () => {
      vigente = false
    }
  }, [clave, numero, pagina, busqueda, filtroConvocatoria, filtroFicha, refresco])

  // "Buscando" incluye la consulta en curso y los 300 ms de espera mientras se
  // escribe: durante ese tiempo no se puede afirmar que no hay resultados.
  const buscando = cargando || numero !== resuelta || termino !== busqueda
  const actualizando = buscando && !cargando

  const hayFilas = filas.length > 0
  // Sin filas que conservar, buscar se muestra como carga; con filas, estas se
  // mantienen a plena opacidad hasta que llegan las nuevas.
  const verEsqueleto = !hayFilas && buscando
  const verVacio = !hayFilas && !buscando && !error
  const mostrarTotal = !cargando && !(error && !hayFilas)

  // Cambiar un filtro vuelve a la página 1.
  const elegir = (guardar) => (valor) => {
    guardar(valor)
    setPagina(1)
  }
  const elegirFicha = elegir(setFiltroFicha)
  const elegirConvocatoria = elegir(setFiltroConvocatoria)

  // La búsqueda se quita al instante (sin esperar los 300 ms): es una acción
  // explícita. Limpiar restablece búsqueda, ficha, convocatoria y página 1.
  const quitarBusqueda = () => {
    setTermino('')
    setBusqueda('')
    setPagina(1)
  }
  const limpiarFiltros = () => {
    quitarBusqueda()
    setFiltroFicha('')
    setFiltroConvocatoria('')
  }

  const fichaElegida = fichas.find((f) => String(f.id) === String(filtroFicha))
  const convocatoriaElegida = convocatorias.find((c) => String(c.id) === String(filtroConvocatoria))

  const opcionesFicha = fichas.map((f) => ({
    id: f.id,
    texto: f.nombre_programa ? `${f.codigo} · ${f.nombre_programa}` : f.codigo,
  }))
  const opcionesConvocatoria = convocatorias.map((c) => ({ id: c.id, texto: c.titulo }))

  const filtrosActivos = [
    termino && { tipo: 'Búsqueda', texto: termino, quitar: quitarBusqueda },
    filtroFicha && {
      tipo: 'Ficha',
      texto: fichaElegida?.codigo ?? filtroFicha,
      quitar: () => elegirFicha(''),
    },
    filtroConvocatoria && {
      tipo: 'Convocatoria',
      texto: convocatoriaElegida?.titulo ?? filtroConvocatoria,
      quitar: () => elegirConvocatoria(''),
    },
  ].filter(Boolean)
  // Cuántos filtros esconde el panel plegable (la búsqueda siempre está a la vista).
  const filtrosDelPanel = (filtroFicha ? 1 : 0) + (filtroConvocatoria ? 1 : 0)

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className={`${CLASE_TITULO_PAGINA} text-balance`}>Evaluación de aspirantes</h1>
          <p className={CLASE_SUBTITULO_PAGINA}>
            Revisa el portafolio de cada aspirante, registra su evaluación y consulta el resultado.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 self-start sm:self-auto">
          {mostrarTotal ? (
            <p
              className="inline-flex items-baseline gap-1.5 rounded-full bg-sena-hundido px-4 py-1.5 text-sm text-sena-azul dark:bg-sena-superficie-alta dark:text-sena-texto"
              aria-live="polite"
            >
              <span className="text-lg font-bold tabular-nums">{meta.total}</span>
              {/* El espacio inicial no se ve (el flex lo ignora) pero hace que
                  un lector de pantalla diga "3 aspirantes" y no "3aspirantes". */}
              {meta.total === 1 ? ' aspirante' : ' aspirantes'}
            </p>
          ) : cargando ? (
            <Hueco className="h-9 w-32 rounded-full" />
          ) : null}

          {/* Indicador de actualización. El aviso para lectores de pantalla
              existe siempre (sr-only) para que el cambio se anuncie; a la vista
              solo aparece mientras hay una consulta pendiente, a la izquierda del
              total para que este no se mueva. */}
          <p
            role="status"
            className={
              actualizando
                ? `inline-flex items-center gap-2 text-xs sm:order-first ${CLASE_TEXTO_SUAVE}`
                : 'sr-only'
            }
          >
            {actualizando && (
              <>
                <span
                  className="size-3 rounded-full border-2 border-current border-t-transparent motion-safe:animate-spin"
                  aria-hidden="true"
                />
                Actualizando resultados...
              </>
            )}
          </p>
        </div>
      </header>

      {/* Los filtros van directamente sobre el lienzo, sin tarjeta alrededor. */}
      <div className="@container">
        <div role="search" aria-label="Filtrar aspirantes" className="flex flex-col gap-3">
          {/* Las columnas dependen del ancho de este bloque (no de la ventana):
              el buscador ocupa una fila entera hasta que caben tres campos sin
              cortar el texto de las opciones. */}
          <div className="grid gap-3 @min-[520px]:grid-cols-2 @min-[860px]:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_minmax(0,1fr)] md:items-end">
            <Campo
              etiqueta="Buscar aspirante"
              className="@min-[520px]:col-span-2 @min-[860px]:col-span-1"
            >
              <div className="relative">
                <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-500 dark:text-sena-texto-suave">
                  <IconoLupa />
                </span>
                <input
                  type="search"
                  placeholder="Nombre o correo..."
                  value={termino}
                  onChange={(e) => setTermino(e.target.value)}
                  className={`${CLASE_CAMPO} pl-10`}
                />
              </div>
            </Campo>

            <Boton
              variante="contorno"
              tamano="tactil"
              onClick={() => setFiltrosAbiertos((v) => !v)}
              aria-expanded={filtrosAbiertos}
              aria-controls="evaluacion-filtros"
              className="col-span-full w-full whitespace-normal! md:hidden"
            >
              <span className="flex w-full items-center justify-between gap-2">
                <span className="inline-flex items-center gap-2">
                  <Icono nombre="filtro" className="size-4" />
                  Ficha y convocatoria
                  {filtrosDelPanel > 0 && (
                    <span className="rounded-full bg-sena-oscuro px-2 py-0.5 text-xs font-semibold tabular-nums text-white dark:bg-sena-acento dark:text-sena-noche">
                      {filtrosDelPanel}
                      <span className="sr-only">
                        {filtrosDelPanel === 1 ? ' filtro activo' : ' filtros activos'}
                      </span>
                    </span>
                  )}
                </span>
                <Icono
                  nombre="chevron"
                  className={`size-4 transition-transform motion-reduce:transition-none ${
                    filtrosAbiertos ? 'rotate-180' : ''
                  }`}
                />
              </span>
            </Boton>

            {/* En móvil se pliega con 'hidden' (fuera del teclado y de los
                lectores de pantalla); desde md los dos selects se integran en
                la fila de la cuadrícula. */}
            <div
              id="evaluacion-filtros"
              className={`${filtrosAbiertos ? 'grid' : 'hidden'} col-span-full gap-3 @min-[520px]:grid-cols-2 md:contents`}
            >
              {puedeFiltrarPorFicha && (
                <FiltroSelect
                  etiqueta="Ficha"
                  valor={filtroFicha}
                  onElegir={elegirFicha}
                  todas="Todas las fichas"
                  opciones={opcionesFicha}
                />
              )}
              <FiltroSelect
                etiqueta="Convocatoria"
                valor={filtroConvocatoria}
                onElegir={elegirConvocatoria}
                todas="Todas las convocatorias"
                opciones={opcionesConvocatoria}
              />
            </div>
          </div>

          {filtrosActivos.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 border-t border-sena-linea/70 pt-3 dark:border-sena-borde/50">
              <p className={`text-sm font-medium ${CLASE_TEXTO_SUAVE}`}>Filtros activos:</p>
              <ul className="flex flex-wrap items-center gap-2">
                {filtrosActivos.map((f) => (
                  <li key={f.tipo}>
                    <ChipFiltro tipo={f.tipo} texto={f.texto} onQuitar={f.quitar} />
                  </li>
                ))}
              </ul>
              <Boton variante="contorno" tamano="tactil" onClick={limpiarFiltros}>
                Limpiar filtros
              </Boton>
            </div>
          )}
        </div>
      </div>

      {error && <MensajeError>{error}</MensajeError>}

      {/* La tabla de seis columnas aparece cuando ESTE contenedor mide 940 px o
          más (no la ventana: el menú lateral le quita ancho). Por debajo, cada
          aspirante es una tarjeta. Las clases @min-[...] van escritas completas
          porque Tailwind no genera las que se arman concatenando cadenas. */}
      <div className="@container flex flex-col gap-3" aria-busy={actualizando}>
        {verEsqueleto && (
          <EsqueletoListado texto={cargando ? 'Cargando aspirantes...' : 'Buscando aspirantes...'} />
        )}

        {verVacio && (
          <div className={`${CLASE_TARJETA_PLANA} flex flex-col items-center gap-3 px-6 py-12 text-center`}>
            <h2 className={`text-lg font-semibold ${CLASE_TEXTO_FUERTE}`}>
              {filtrosActivos.length > 0
                ? 'Ningún aspirante coincide con los filtros'
                : 'Aún no hay aspirantes para evaluar'}
            </h2>
            <p className={`max-w-md text-sm ${CLASE_TEXTO_SUAVE}`}>
              {filtrosActivos.length > 0
                ? 'Prueba con otro nombre o correo, o quita algún filtro.'
                : 'Cuando haya postulaciones en tus fichas, aparecerán aquí.'}
            </p>
            {filtrosActivos.length > 0 && (
              <Boton variante="contorno" tamano="tactil" onClick={limpiarFiltros}>
                Limpiar filtros
              </Boton>
            )}
          </div>
        )}

        {hayFilas && (
          <>
            <div className="hidden @min-[940px]:block">
              <div className={`${CLASE_TARJETA_PLANA} overflow-hidden`}>
                <table className="w-full table-fixed text-left text-sm">
                  <caption className="sr-only">Aspirantes por evaluar</caption>
                  {/* Anchos medidos en pantalla: las cuatro columnas pequeñas son
                      fijas y caben su encabezado y su contenido más ancho (la
                      etiqueta "Pasa a selección" mide 145 px). Aspirante toma un
                      26 % y Convocatoria el resto. */}
                  <colgroup>
                    <col className="w-[26%]" />
                    <col />
                    <col className="w-38" />
                    <col className="w-22" />
                    <col className="w-44" />
                    <col className="w-28" />
                  </colgroup>
                  <thead className={CLASE_THEAD}>
                    <tr>
                      {['Aspirante', 'Convocatoria', 'Documentos subidos', 'Cumplimiento', 'Evaluación'].map(
                        (titulo) => (
                          <th key={titulo} scope="col" className={CLASE_TH}>
                            {titulo}
                          </th>
                        ),
                      )}
                      <th scope="col" className={`${CLASE_TH} text-right`}>
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className={CLASE_TBODY}>
                    {filas.map((fila) => (
                      <FilaTabla key={fila.id} fila={fila} />
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <ul className="grid gap-3 @min-[600px]:grid-cols-2 @min-[940px]:hidden">
              {filas.map((fila) => (
                <TarjetaAspirante key={fila.id} fila={fila} />
              ))}
            </ul>

            <nav
              aria-label="Paginación de aspirantes"
              className="flex flex-col gap-3 text-sm sm:flex-row sm:items-center sm:justify-between"
            >
              <p className={CLASE_TEXTO_SUAVE}>
                Página <span className="tabular-nums">{meta.current_page}</span> de{' '}
                <span className="tabular-nums">{Math.max(meta.last_page, 1)}</span> ·{' '}
                <span className="tabular-nums">{meta.total}</span> aspirante(s)
              </p>
              <div className="flex flex-wrap gap-2">
                <Boton
                  variante="contorno"
                  tamano="tactil"
                  className="min-w-32 flex-1 sm:flex-none"
                  onClick={() => setPagina((p) => Math.max(1, p - 1))}
                  disabled={meta.current_page <= 1}
                >
                  <IconoFlechaIzquierda className="h-4 w-4" />
                  Anterior
                </Boton>
                <Boton
                  variante="contorno"
                  tamano="tactil"
                  className="min-w-32 flex-1 sm:flex-none"
                  onClick={() => setPagina((p) => Math.min(meta.last_page, p + 1))}
                  disabled={meta.current_page >= meta.last_page}
                >
                  Siguiente
                  <IconoFlechaDerecha className="h-4 w-4" />
                </Boton>
              </div>
            </nav>
          </>
        )}
      </div>
    </div>
  )
}
