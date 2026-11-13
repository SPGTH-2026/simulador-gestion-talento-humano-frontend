import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate, useNavigationType } from 'react-router-dom'
import useFiltrosUrl from '../../hooks/useFiltrosUrl'
import { useAuth } from '../../auth/useAuth'
import {
  listaConvocatorias,
  cambiarEstadoConvocatoria,
  listaParametros,
} from '../../api/convocatorias'
import { listaFichas } from '../../api/fichas'
import { mensajeError } from '../../api/mensajeError'
import EtiquetaEstado from '../../components/convocatorias/EtiquetaEstado'
import EtiquetaPostulacion from '../../components/convocatorias/EtiquetaPostulacion'
import EtiquetaVentana from '../../components/convocatorias/EtiquetaVentana'
import Boton from '../../components/ui/Boton'
import Campo from '../../components/ui/Campo'
import CampoBusqueda from '../../components/ui/CampoBusqueda'
import Icono from '../../components/ui/Icono'
import Paginacion from '../../components/ui/Paginacion'
import Rueda from '../../components/ui/Rueda'
import { MensajeError } from '../../components/ui/Mensaje'
import Tarjeta from '../../components/ui/Tarjeta'
import { useConfirmacion } from '../../hooks/useConfirmacion'
import { pasoDeEstado, veIdentificador } from '../../lib/convocatorias'
import { formatearFecha, textoCierraPronto } from '../../lib/ventanaPostulacion'
import {
  CLASE_CAMPO,
  CLASE_CHIP,
  CLASE_META_DD,
  CLASE_META_DT,
  CLASE_SUBTITULO_PAGINA,
  CLASE_TARJETA_PLANA,
  CLASE_TITULO_PAGINA,
} from '../../lib/estilos'

// Bloques del esqueleto de carga. La animación se apaga si el usuario pidió
// reducir el movimiento.
const CLASE_ESQUELETO =
  'animate-pulse rounded-md bg-sena-hundido motion-reduce:animate-none dark:bg-sena-superficie-alta'

// Botones de la tarjeta: 44 px de alto en pantallas táctiles y 40 px desde 'lg',
// como el resto de la aplicación. Cada acción lleva su icono junto al texto, del
// sistema compartido (components/ui/Icono): el mismo tamaño y trazo en todos.
// El texto puede partirse en dos líneas en un botón angosto, pero nunca se
// comprime ni se corta.
const CLASE_BOTON_ACCION = 'justify-center'

// Tamaño único de los iconos de los botones.
const ICONO_BOTON = 'size-5 shrink-0'

// Texto de un botón de acción: como último recurso, en pantallas extremadamente
// estrechas (zoom muy alto) una palabra larga se parte dentro del botón en vez de
// salirse de él.
const TEXTO_BOTON = 'min-w-0 [overflow-wrap:anywhere]'

// "Editar" y el cierre comparten fila cuando el CONTENIDO de la tarjeta mide al
// menos 320 px. Medido en el navegador: "Editar" con su icono ocupa ~101 px y
// "Cerrar convocatoria" ~196 px; con 8 px de separación son ~305 px, así que 320
// deja un margen sin partir el texto. "Editar" toma su ancho natural y el cierre
// el resto. Por debajo se apilan. Es una consulta de contenedor (la tarjeta es
// '@container'), así que depende del ancho de la tarjeta y no del de la ventana.
// Las clases '@min-[320px]:...' van escritas completas en el JSX: Tailwind no
// genera las que se arman concatenando cadenas.

// Nombre legible de un estado por si el catálogo todavía no ha llegado.
const NOMBRES_ESTADO = { publicada: 'Publicada', en_proceso: 'En proceso', cerrada: 'Cerrada' }

// Parámetros de la URL que usa este listado (ver useFiltrosUrl). La página va
// con los filtros: así sobrevive a recargar, a "atrás" y al regreso del detalle.
const CLAVES_FILTRO = ['q', 'estado', 'ficha', 'tipo', 'modalidad', 'orden', 'page']

// Orden de la lista. 'reciente' es el predeterminado y no viaja en la URL ni a
// la API; el backend acepta exactamente estos valores.
const ORDENES = [
  { valor: 'reciente', texto: 'Más recientes' },
  { valor: 'antigua', texto: 'Más antiguas' },
  { valor: 'nombre', texto: 'Nombre (A-Z)' },
  { valor: 'cierre', texto: 'Próximas a cerrar' },
]

const movimientoReducido = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

export default function ConvocatoriasListado() {
  const navigate = useNavigate()
  const { user, can } = useAuth()
  const gestiona = can('convocatorias:gestionar')
  // El filtro por ficha solo lo ve quien puede listar fichas: super admin e
  // instructor ('usuarios:gestionar'). Un gestor de convocatorias sin ese
  // permiso no puede pedir GET /api/fichas y no debe ver el selector.
  const puedeFiltrarFicha = gestiona && can('usuarios:gestionar')
  // El aspirante ve una sola acción por tarjeta: "Ver información" (navega al
  // detalle siempre; el 404 de las no publicadas lo absorbe la vista).
  const esAspirante = user?.role === 'aspirante'
  // Gestión REAL: permiso + lista blanca (instructor, super admin y el subrol
  // gestor_convocatorias). El aprendiz con subrol 'general' tiene el permiso
  // 'convocatorias:gestionar' pero NO es gestión. Decide dos cosas:
  //  - el identificador (CONV-AAAA-NNN), dato de gestión;
  //  - qué estados ve la lista: las cerradas solo las ve la gestión.
  const gestionaEstricto = veIdentificador(user, can)

  const [convocatorias, setConvocatorias] = useState([])
  const [fichas, setFichas] = useState([])
  const [opcionesEstado, setOpcionesEstado] = useState([])
  const [opcionesTipo, setOpcionesTipo] = useState([])
  const [opcionesModalidad, setOpcionesModalidad] = useState([])
  const [meta, setMeta] = useState({ current_page: 1, last_page: 1, total: 0 })

  // Búsqueda, filtros y página viven en la URL. 'termino' es solo el texto que
  // se está escribiendo; pasa a la URL con un antirrebote de 300 ms.
  const { valores, setValores } = useFiltrosUrl(CLAVES_FILTRO)
  const busqueda = valores.q
  const filtroEstado = valores.estado
  const filtroFicha = valores.ficha
  const filtroTipo = valores.tipo
  const filtroModalidad = valores.modalidad
  // Un orden desconocido en la URL (enlace viejo o editado) cae al predeterminado.
  const orden = ORDENES.some((o) => o.valor === valores.orden) ? valores.orden : 'reciente'
  const pagina = Math.max(1, Number.parseInt(valores.page, 10) || 1)

  // Cambiar la búsqueda o un filtro estando en la página 2 o posterior añade una
  // entrada al historial (así "atrás" vuelve a esa página); desde la página 1 la
  // reemplaza, para no llenar el historial con cada cambio.
  const reemplazar = !valores.page

  const [termino, setTermino] = useState(valores.q)
  // Cuando la búsqueda de la URL cambia, el campo debe reflejarla salvo que el
  // cambio lo haya escrito este mismo componente (el campo ya lo tiene, y puede
  // incluso ir por delante si se siguió escribiendo). Se sabe con la propia
  // navegación: lo escrito aquí lleva 'state.origen = buscador' y NO es un "atrás" o
  // "adelante" (POP): las entradas del historial conservan su 'state', así que
  // volver a una de ellas sí es un cambio externo. Atrás, adelante, un enlace a
  // /convocatorias y limpiar actualizan el campo; no hace falta recordar nada
  // entre un render y otro.
  const ubicacion = useLocation()
  const tipoNavegacion = useNavigationType()
  const [qVista, setQVista] = useState(valores.q)
  if (valores.q !== qVista) {
    setQVista(valores.q)
    const loEscribioElBuscador =
      tipoNavegacion !== 'POP' && ubicacion.state?.origen === 'buscador'
    if (!loEscribioElBuscador) setTermino(valores.q)
  }

  const [recarga, setRecarga] = useState(0)
  const [cargando, setCargando] = useState(true)
  const [errorConsulta, setErrorConsulta] = useState(null)
  // De qué búsqueda, filtros y página son los datos que hay en pantalla. Si una
  // consulta falla, la lista anterior solo se conserva cuando es la de la misma
  // búsqueda (por ejemplo, al releer tras cerrar una convocatoria): mostrar bajo
  // un error las tarjetas de otra búsqueda confundiría.
  const [datosDe, setDatosDe] = useState(null)
  const [accionandoId, setAccionandoId] = useState(null)
  const [errorAccion, setErrorAccion] = useState('')

  // Cada cambio de página, búsqueda, filtro o recarga es una consulta nueva con
  // su propio número. Se numera al renderizar (sin esperar al efecto) para que
  // no haya un instante con filtros nuevos y la pantalla sin saber que busca. Se
  // compara el número y no los filtros: al volver de B a A, la consulta de A es
  // otra aunque sus filtros coincidan con una ya resuelta.
  const clave = [pagina, busqueda, filtroEstado, filtroFicha, filtroTipo, filtroModalidad, orden, recarga].join('|')
  const [solicitada, setSolicitada] = useState({ clave, numero: 0 })
  if (solicitada.clave !== clave) setSolicitada({ clave, numero: solicitada.numero + 1 })
  const { numero } = solicitada
  const [resuelta, setResuelta] = useState(null)

  // El texto se aplaza 300 ms para no martillar el backend letra a letra. Solo
  // se escribe en la URL si difiere de la búsqueda vigente, y cambiarla vuelve a
  // la primera página.
  useEffect(() => {
    const t = setTimeout(() => {
      if (termino !== valores.q) {
        setValores({ q: termino, page: '' }, { reemplazar, state: { origen: 'buscador' } })
      }
    }, 300)
    return () => clearTimeout(t)
  }, [termino, valores.q, reemplazar, setValores])

  // Las opciones del filtro salen del catálogo (tema estado_convocatoria), no
  // del código: así un estado nuevo en el backend aparece sin tocar el front.
  useEffect(() => {
    let activo = true
    listaParametros('estado_convocatoria')
      .then((res) => {
        if (activo) setOpcionesEstado(res.data ?? [])
      })
      .catch(() => {
        if (activo) setOpcionesEstado([])
      })
    return () => {
      activo = false
    }
  }, [])

  // Tipo y modalidad también salen del catálogo, igual que los estados.
  useEffect(() => {
    let activo = true
    Promise.all([listaParametros('tipo_convocatoria'), listaParametros('modalidad')])
      .then(([tipos, modalidades]) => {
        if (!activo) return
        setOpcionesTipo(tipos.data ?? [])
        setOpcionesModalidad(modalidades.data ?? [])
      })
      .catch(() => {
        if (!activo) return
        setOpcionesTipo([])
        setOpcionesModalidad([])
      })
    return () => {
      activo = false
    }
  }, [])

  // Las fichas del filtro salen del alcance del usuario (GET /api/fichas):
  // un instructor solo ve las suyas; el super admin, todas.
  useEffect(() => {
    if (!puedeFiltrarFicha) return undefined

    let activo = true
    listaFichas()
      .then((res) => {
        if (activo) setFichas(res.data ?? [])
      })
      .catch(() => {
        if (activo) setFichas([])
      })

    return () => {
      activo = false
    }
  }, [puedeFiltrarFicha])

  // Cada ejecución del efecto es una consulta; al cambiar los filtros, o al salir
  // de la pantalla, la limpieza la marca como vencida y su respuesta (datos,
  // totales, error o fin de carga) se descarta. Así una respuesta lenta o fuera
  // de orden nunca pisa a la de una consulta más nueva. Mientras llega la nueva,
  // la lista conserva los datos anteriores.
  useEffect(() => {
    let vigente = true
    const filtros = [pagina, busqueda, filtroEstado, filtroFicha, filtroTipo, filtroModalidad, orden].join('|')

    listaConvocatorias({
      page: pagina,
      q: busqueda || undefined,
      estado: filtroEstado || undefined,
      ficha_id: filtroFicha || undefined,
      tipo_convocatoria: filtroTipo || undefined,
      modalidad: filtroModalidad || undefined,
      orden: orden !== 'reciente' ? orden : undefined,
    })
      .then((res) => {
        if (!vigente) return
        setConvocatorias(res.data)
        setMeta(res.meta)
        setDatosDe(filtros)
        setErrorConsulta(null)
        // Una página que ya no existe (enlace viejo, o se cerraron convocatorias
        // y hay menos páginas) se corrige a la última en vez de mostrar vacío.
        if (res.meta?.last_page > 0 && pagina > res.meta.last_page) {
          setValores({ page: res.meta.last_page > 1 ? res.meta.last_page : '' })
        }
      })
      .catch((e) => {
        if (vigente) setErrorConsulta({ numero, mensaje: mensajeError(e) })
      })
      .finally(() => {
        if (!vigente) return
        setCargando(false)
        setResuelta(numero)
      })

    return () => {
      vigente = false
    }
  }, [clave, numero, pagina, busqueda, filtroEstado, filtroFicha, filtroTipo, filtroModalidad, orden, setValores])

  // El error pertenece a una consulta: al reintentar o cambiar de consulta deja
  // de verse sin esperar a la respuesta.
  const error = errorConsulta && errorConsulta.numero === numero ? errorConsulta.mensaje : ''

  // "Buscando" incluye la consulta en curso y los 300 ms de espera mientras se
  // escribe: durante ese tiempo no se puede afirmar que no hay resultados.
  const buscando = cargando || numero !== resuelta || termino !== busqueda

  const hayConvocatorias = convocatorias.length > 0
  const datosVigentes =
    datosDe === [pagina, busqueda, filtroEstado, filtroFicha, filtroTipo, filtroModalidad, orden].join('|')
  // La lista (y su paginación y total) se ve salvo que haya un error y los datos
  // sean de otra búsqueda.
  const hayLista = hayConvocatorias && (!error || datosVigentes)
  const verEsqueleto = !hayLista && buscando && !error
  const verVacio = !hayConvocatorias && !buscando && !error
  const mostrarTotal = !cargando && !(error && !hayLista)

  // Al paginar se lleva el inicio de los resultados a la vista cuando llega la
  // página nueva. Solo ocurre al pulsar Anterior o Siguiente: escribir en la
  // búsqueda o cambiar un filtro no mueve la pantalla ni el foco.
  const refResultados = useRef(null)
  const alPaginar = useRef(false)
  useEffect(() => {
    if (!alPaginar.current || resuelta !== numero) return
    alPaginar.current = false
    refResultados.current?.scrollIntoView({
      block: 'start',
      behavior: movimientoReducido() ? 'auto' : 'smooth',
    })
  }, [resuelta, numero])

  const irAPagina = (destino) => {
    const n = Math.min(Math.max(1, destino), Math.max(1, meta.last_page))
    if (n === pagina) return
    alPaginar.current = true
    // Cada página es una entrada del historial: "atrás" vuelve a la anterior.
    setValores({ page: n > 1 ? n : '' }, { reemplazar: false })
  }

  const confirmar = useConfirmacion()

  // El diálogo explica la transición concreta y lo que implica, con lo que
  // hace el backend: de Publicada a En proceso se cierra la recepción de
  // postulaciones y deja de poder editarse; de En proceso a Cerrada no hay
  // vuelta atrás. Los estados avanzan de uno en uno y no se reabren.
  const textosCierre = (convocatoria, destino) => {
    const nombreDestino =
      opcionesEstado.find((o) => o.codigo === destino)?.nombre ?? NOMBRES_ESTADO[destino] ?? destino
    const nombreActual =
      convocatoria.estado?.nombre ?? NOMBRES_ESTADO[convocatoria.estado?.codigo] ?? 'su estado actual'

    if (destino === 'en_proceso') {
      return {
        titulo: 'Cerrar convocatoria',
        mensaje: `"${convocatoria.nombre}" pasará de ${nombreActual} a ${nombreDestino}: dejará de recibir postulaciones y ya no se podrá editar. Después podrás cerrarla del todo. Esta acción no se puede deshacer.`,
        textoConfirmar: `Pasar a ${nombreDestino}`,
      }
    }

    return {
      titulo: 'Cerrar convocatoria',
      mensaje: `"${convocatoria.nombre}" pasará de ${nombreActual} a ${nombreDestino}: quedará cerrada y no se podrá reabrir ni editar. Esta acción no se puede deshacer.`,
      textoConfirmar: 'Cerrar convocatoria',
    }
  }

  const avanzarEstado = async (convocatoria, { destino }) => {
    const ok = await confirmar({
      ...textosCierre(convocatoria, destino),
      textoCancelar: 'Cancelar',
      peligro: true,
    })
    if (!ok) return

    setAccionandoId(convocatoria.id)
    setErrorAccion('')

    try {
      await cambiarEstadoConvocatoria(convocatoria.id, { estado: destino })
    } catch (e) {
      // 422 (transición inválida), 403 (sin permiso) y 404 se muestran tal cual.
      setErrorAccion(mensajeError(e))
    } finally {
      setAccionandoId(null)
      // Tras responder (bien o mal) se relee la lista: la UI refleja el estado
      // real del servidor y no el que creíamos localmente.
      setRecarga((n) => n + 1)
    }
  }

  // Limpiar quita búsqueda, filtros y orden de una vez, al instante (sin esperar
  // los 300 ms) y vuelve a la primera página.
  const limpiarFiltros = () => {
    setTermino('')
    setValores({ q: '', estado: '', ficha: '', tipo: '', modalidad: '', orden: '', page: '' }, { reemplazar })
  }

  const hayFiltros = Boolean(
    termino || filtroFicha || filtroEstado || filtroTipo || filtroModalidad || orden !== 'reciente',
  )

  // Las mismas acciones se usan en todas las tarjetas, para no duplicar la
  // lógica de permisos. "Ver detalle" va a todo el ancho y es navegación (contorno, sin icono);
  // "Editar" y el cierre comparten una fila encima.
  const renderAcciones = (c) => {
    const paso = pasoDeEstado(c.estado?.codigo)
    const editable = c.estado?.codigo === 'borrador' || c.estado?.codigo === 'publicada'

    // El aspirante ve UNA sola acción: "Ver información". Siempre disponible,
    // incluso si la convocatoria ya no está publicada: el detalle absorbe el 404.
    if (esAspirante) {
      return (
        // «Ver información» abre una pantalla: es navegación (contorno) y un enlace de verdad, para que la barra de
        // carga del marco y «abrir en otra pestaña» funcionen.
        <Boton
          as={Link}
          to={`/convocatorias/${c.id}`}
          variante="contorno"
          tamano="flexible"
          className={CLASE_BOTON_ACCION}
          aria-label={`Ver información de ${c.nombre}`}
        >
          <span className={TEXTO_BOTON}>Ver información</span>
        </Boton>
      )
    }

    const mostrarEditar = gestiona && editable
    const mostrarCerrar = gestiona && paso
    // Con las dos acciones, comparten fila cuando caben; con una sola, esa va a
    // todo el ancho.
    const comparten = mostrarEditar && mostrarCerrar

    return (
      <>
        {/* Las acciones secundarias van ARRIBA y "Ver detalle" siempre al final: el pie de la tarjeta
            va pegado al fondo, así "Ver detalle" queda a la misma altura en todas las tarjetas de una
            fila aunque unas tengan Editar/Cerrar y otras no. */}
        {(mostrarEditar || mostrarCerrar) && (
          <div
            className={
              comparten ? 'flex flex-col gap-2 @min-[320px]:flex-row' : 'flex flex-col gap-2'
            }
          >
            {mostrarEditar && (
              <Boton
                as={Link}
                to={`/convocatorias/${c.id}/editar`}
                variante="contorno"
                tamano="flexible"
                className={`${CLASE_BOTON_ACCION} ${comparten ? '@min-[320px]:flex-none' : ''}`}
                aria-label={`Editar ${c.nombre}`}
              >
                <span className={TEXTO_BOTON}>Editar</span>
              </Boton>
            )}

            {mostrarCerrar && (
              <Boton
                variante="peligroSuave"
                tamano="flexible"
                className={`${CLASE_BOTON_ACCION} ${
                  comparten ? '@min-[320px]:min-w-0 @min-[320px]:flex-1' : ''
                }`}
                disabled={accionandoId === c.id}
                onClick={() => avanzarEstado(c, paso)}
                aria-label={`${paso.etiqueta} ${c.nombre}`}
              >
                <span className={TEXTO_BOTON}>{paso.etiqueta}</span>
              </Boton>
            )}
          </div>
        )}

        <Boton
          as={Link}
          to={`/convocatorias/${c.id}`}
          variante="contorno"
          tamano="flexible"
          className={CLASE_BOTON_ACCION}
          aria-label={`Ver detalle de ${c.nombre}`}
        >
          <span className={TEXTO_BOTON}>Ver detalle</span>
        </Boton>
      </>
    )
  }

  const totalTexto = `${meta.total} ${meta.total === 1 ? 'convocatoria' : 'convocatorias'}`

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className={CLASE_TITULO_PAGINA}>Convocatorias</h1>
          <p className={CLASE_SUBTITULO_PAGINA}>
            {gestiona
              ? 'Gestiona y consulta las convocatorias de los procesos de selección.'
              : 'Consulta las convocatorias publicadas y revisa sus condiciones.'}
          </p>
        </div>

        {gestiona && (
          <Boton
            tamano="flexible"
            onClick={() => navigate('/convocatorias/nueva')}
            className="self-start sm:self-auto"
          >
            <Icono nombre="mas" className={ICONO_BOTON} />
            Nueva convocatoria
          </Boton>
        )}
      </div>

      {/* Buscador y filtros. El estado solo lo ve quien gestiona de verdad; la
          ficha, solo quien puede listar fichas. El contador y el indicador de
          actualización viven en la misma barra. */}
      <Tarjeta className="p-4">
        <div role="search" aria-label="Buscar y filtrar convocatorias" className="flex flex-col gap-3">
          {/* El buscador ocupa siempre su propia fila y los filtros van debajo, que
              se reparten según el espacio. Antes el buscador subía junto a los
              filtros en pantallas anchas; con los filtros de tipo, modalidad y
              orden ya no cabían en una línea, se partían en dos filas y el
              buscador (alineado abajo) dejaba un hueco arriba a la izquierda. */}
          <div className="flex flex-col gap-3">
            <Campo
              etiqueta={gestionaEstricto ? 'Buscar por nombre, código o cargo' : 'Buscar por nombre o cargo'}
            >
              {({ id, describedby }) => (
                <CampoBusqueda
                  id={id}
                  placeholder="Escribe para buscar…"
                  value={termino}
                  onChange={(e) => setTermino(e.target.value)}
                  aria-describedby={describedby}
                />
              )}
            </Campo>

            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
            {gestionaEstricto && (
              <Campo etiqueta="Estado" className="sm:w-52 sm:shrink-0">
                {({ id }) => (
                  <select
                    id={id}
                    value={filtroEstado}
                    onChange={(e) => setValores({ estado: e.target.value, page: '' }, { reemplazar })}
                    className={CLASE_CAMPO}
                  >
                    <option value="">Todos los estados</option>
                    {opcionesEstado.map((o) => (
                      <option key={o.codigo} value={o.codigo}>
                        {o.nombre}
                      </option>
                    ))}
                  </select>
                )}
              </Campo>
            )}

            <Campo etiqueta="Tipo" className="sm:w-48 sm:shrink-0">
              {({ id }) => (
                <select
                  id={id}
                  value={filtroTipo}
                  onChange={(e) => setValores({ tipo: e.target.value, page: '' }, { reemplazar })}
                  className={CLASE_CAMPO}
                >
                  <option value="">Todos los tipos</option>
                  {opcionesTipo.map((o) => (
                    <option key={o.codigo} value={o.codigo}>
                      {o.nombre}
                    </option>
                  ))}
                </select>
              )}
            </Campo>

            <Campo etiqueta="Modalidad" className="sm:w-48 sm:shrink-0">
              {({ id }) => (
                <select
                  id={id}
                  value={filtroModalidad}
                  onChange={(e) => setValores({ modalidad: e.target.value, page: '' }, { reemplazar })}
                  className={CLASE_CAMPO}
                >
                  <option value="">Todas las modalidades</option>
                  {opcionesModalidad.map((o) => (
                    <option key={o.codigo} value={o.codigo}>
                      {o.nombre}
                    </option>
                  ))}
                </select>
              )}
            </Campo>

            <Campo etiqueta="Ordenar por" className="sm:w-48 sm:shrink-0">
              {({ id }) => (
                <select
                  id={id}
                  value={orden}
                  onChange={(e) =>
                    setValores(
                      { orden: e.target.value === 'reciente' ? '' : e.target.value, page: '' },
                      { reemplazar },
                    )
                  }
                  className={CLASE_CAMPO}
                >
                  {ORDENES.map((o) => (
                    <option key={o.valor} value={o.valor}>
                      {o.texto}
                    </option>
                  ))}
                </select>
              )}
            </Campo>

            {puedeFiltrarFicha && (
              <Campo etiqueta="Ficha" className="sm:min-w-0 sm:max-w-sm sm:flex-1">
                {({ id }) => (
                  <select
                    id={id}
                    value={filtroFicha}
                    onChange={(e) => setValores({ ficha: e.target.value, page: '' }, { reemplazar })}
                    className={CLASE_CAMPO}
                  >
                    <option value="">Todas las fichas</option>
                    {fichas.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.codigo} · {f.nombre_programa}
                      </option>
                    ))}
                  </select>
                )}
              </Campo>
            )}
            </div>
          </div>
        </div>
      </Tarjeta>

      {errorAccion && <MensajeError>{errorAccion}</MensajeError>}

      {error && (
        <div className="flex flex-col items-start gap-3">
          <MensajeError className="w-full">{error}</MensajeError>
          <Boton variante="contorno" tamano="flexible" onClick={() => setRecarga((n) => n + 1)}>
            <Icono nombre="reintentar" className={ICONO_BOTON} />
            Reintentar
          </Boton>
        </div>
      )}

      {/* Inicio de los resultados: a donde se lleva la pantalla al paginar. */}
      <div ref={refResultados} className="flex scroll-mt-4 flex-col gap-4" aria-busy={buscando}>
        {/* Una sola línea de estado sobre los resultados, siempre con el mismo estilo: carga, actualización o total. */}
        {(buscando || (hayLista && mostrarTotal)) && (
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
            <p
              role="status"
              className="flex min-h-6 items-center gap-2.5 text-base font-medium text-sena-azul dark:text-sena-texto"
            >
              {buscando ? (
                <>
                  <Rueda /> {verEsqueleto ? 'Cargando convocatorias…' : 'Actualizando convocatorias…'}
                </>
              ) : (
                totalTexto
              )}
            </p>
            {/* «Limpiar filtros» vive aquí, junto al total que los filtros acaban de cambiar: así no ocupa un lugar en la
                tarjeta de filtros ni hace que el campo Ficha se parta cuando aparece. */}
            {hayFiltros && (
              <Boton variante="enlace" tamano="tactil" onClick={limpiarFiltros} className="-mr-2">
                <Icono nombre="cerrar" className={ICONO_BOTON} />
                Limpiar filtros
              </Boton>
            )}
          </div>
        )}

        {verEsqueleto && (
          <div className="flex flex-col gap-4" aria-busy="true">
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <Tarjeta key={i} className="p-5">
                <div className="flex items-center justify-between gap-3">
                  <div className={`${CLASE_ESQUELETO} h-4 w-24`} />
                  <div className={`${CLASE_ESQUELETO} h-5 w-16 rounded-full`} />
                </div>
                <div className={`${CLASE_ESQUELETO} mt-4 h-5 w-4/5`} />
                <div className={`${CLASE_ESQUELETO} mt-2 h-4 w-3/5`} />
                <div className="mt-4 flex gap-2">
                  <div className={`${CLASE_ESQUELETO} h-6 w-20 rounded-full`} />
                  <div className={`${CLASE_ESQUELETO} h-6 w-24 rounded-full`} />
                </div>
                <div className="mt-5 grid grid-cols-2 gap-x-5 gap-y-4">
                  <div className={`${CLASE_ESQUELETO} h-9 w-full`} />
                  <div className={`${CLASE_ESQUELETO} h-9 w-full`} />
                  <div className={`${CLASE_ESQUELETO} h-9 w-full`} />
                  <div className={`${CLASE_ESQUELETO} h-9 w-full`} />
                </div>
                <div className={`${CLASE_ESQUELETO} mt-5 h-11 w-full`} />
              </Tarjeta>
            ))}
          </div>
          </div>
        )}

        {verVacio && (
          <Tarjeta className="p-10 text-center" role="status">
            <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-sena-fondo text-sena-azul dark:bg-sena-noche/50 dark:text-sena-texto-suave">
              <Icono nombre="lupa" className="size-6" />
            </div>
            <h2 className="mt-4 text-base font-semibold text-sena-azul dark:text-sena-texto">
              {hayFiltros ? 'No hay convocatorias con esos filtros' : 'Todavía no hay convocatorias'}
            </h2>
            <p className="mx-auto mt-1 max-w-md text-sm text-slate-600 dark:text-sena-texto-suave">
              {hayFiltros
                ? 'Prueba con otro término de búsqueda o quita los filtros para ver todas.'
                : gestiona
                  ? 'Crea la primera convocatoria para empezar a recibir postulaciones.'
                  : 'Cuando se publique una convocatoria, aparecerá aquí.'}
            </p>
            {hayFiltros ? (
              <Boton variante="contorno" tamano="flexible" className="mt-4" onClick={limpiarFiltros}>
                <Icono nombre="cerrar" className={ICONO_BOTON} />
                Limpiar filtros
              </Boton>
            ) : gestiona ? (
              <Boton tamano="flexible" className="mt-4" onClick={() => navigate('/convocatorias/nueva')}>
                <Icono nombre="mas" className={ICONO_BOTON} />
                Nueva convocatoria
              </Boton>
            ) : null}
          </Tarjeta>
        )}

        {/* Rejilla 3/2/1. Cada tarjeta usa solo campos del resumen: nada de
            llamadas al detalle por tarjeta. */}
        {hayLista && (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
            {convocatorias.map((c) => {
              const documentos = c.documentos ?? []
              const obligatorios = documentos.filter((d) => d.obligatorio).length
              // "Cierra en N días" solo cuando faltan 3 días o menos (se calcula
              // con las fechas de la convocatoria, sin zona horaria ambigua).
              const cierraPronto = textoCierraPronto(c.fecha_cierre)

              return (
                <article
                  key={c.id}
                  className={`${CLASE_TARJETA_PLANA} @container flex h-full flex-col p-5 transition-colors hover:border-sena-azul/40 motion-reduce:transition-none dark:hover:border-sena-borde`}
                >
                  {/* 1) Fila superior: identificador (solo gestión) a la
                      izquierda y estado a la derecha. El Aspirante no ve el
                      identificador (dato de gestión) y sí el estado de la
                      ventana: si puede postularse ahora, si aún no abre o si
                      ya cerró. */}
                  <div className="flex items-start justify-between gap-3">
                    <span className="min-w-0 truncate pt-0.5 font-mono text-xs font-medium tracking-wide text-slate-600 dark:text-sena-texto-suave">
                      {gestionaEstricto ? c.codigo : null}
                      {/* La ficha va como texto plano junto al código, y solo cuando el usuario tiene más de una en su
                          alcance (la lista de fichas es el alcance completo, no el resultado filtrado: al filtrar por una
                          sola sigue visible) y la API la entrega (solo Instructor y Superadministrador). */}
                      {fichas.length > 1 && c.ficha?.codigo && (
                        <>
                          {gestionaEstricto ? ' ' : null}
                          <span
                            title={`Ficha ${c.ficha.codigo}${c.ficha.nombre_programa ? ` · ${c.ficha.nombre_programa}` : ''}`}
                            className={gestionaEstricto ? 'ml-3 uppercase' : 'uppercase'}
                          >
                            Ficha {c.ficha.codigo}
                          </span>
                        </>
                      )}
                    </span>
                    <div className="flex shrink-0 flex-wrap items-center justify-end gap-1.5">
                      {esAspirante && <EtiquetaVentana convocatoria={c} />}
                      {(gestionaEstricto || c.estado?.codigo !== 'cerrada') && (
                        <EtiquetaEstado codigo={c.estado?.codigo} nombre={c.estado?.nombre} />
                      )}
                    </div>
                  </div>

                  {/* 2) Identidad: título a dos líneas como máximo (para que las
                      tarjetas de la fila conserven la misma altura) con el
                      nombre completo en el tooltip, y debajo la línea
                      secundaria "cargo · área". */}
                  <div className="mt-4">
                    <h3
                      title={c.nombre}
                      className="line-clamp-2 text-base font-semibold leading-snug text-sena-azul [overflow-wrap:anywhere] dark:text-sena-texto"
                    >
                      {c.nombre}
                    </h3>
                    <p
                      title={[c.cargo, c.area].filter(Boolean).join(' · ')}
                      className="mt-1.5 line-clamp-1 text-sm text-slate-600 dark:text-sena-texto-suave"
                    >
                      {c.cargo}
                      {c.area && <span> · {c.area}</span>}
                    </p>
                  </div>

                  {/* 3) Chips en orden fijo: modalidad, tipo de contrato y tipo
                      de convocatoria. Cada uno dice qué es (title y aria-label),
                      porque el chip solo lleva el valor. */}
                  <div className="mt-4 flex flex-wrap gap-2">
                    {c.modalidad?.nombre && (
                      <span
                        title={`Modalidad: ${c.modalidad.nombre}`}
                        aria-label={`Modalidad: ${c.modalidad.nombre}`}
                        className={CLASE_CHIP}
                      >
                        {c.modalidad.nombre}
                      </span>
                    )}
                    {c.tipo_contrato?.nombre && (
                      <span
                        title={`Tipo de contrato: ${c.tipo_contrato.nombre}`}
                        aria-label={`Tipo de contrato: ${c.tipo_contrato.nombre}`}
                        className={CLASE_CHIP}
                      >
                        {c.tipo_contrato.nombre}
                      </span>
                    )}
                    {c.tipo_convocatoria?.nombre && (
                      <span
                        title={`Tipo de convocatoria: ${c.tipo_convocatoria.nombre}`}
                        aria-label={`Tipo de convocatoria: ${c.tipo_convocatoria.nombre}`}
                        className={CLASE_CHIP}
                      >
                        {c.tipo_convocatoria.nombre}
                      </span>
                    )}
                  </div>

                  {/* 4) Cuadrícula de datos con la etiqueta arriba y el valor
                      abajo. "Apertura" es fecha_apertura (el backend no tiene
                      fecha de publicación). "Postulaciones enviadas" solo lo ve
                      quien puede gestionar y cuenta las postulaciones enviadas
                      de usuarios activos: no es el total de personas. */}
                  <dl className="mt-5 grid grid-cols-2 gap-x-5 gap-y-3.5">
                    <div>
                      <dt className={CLASE_META_DT}>Apertura</dt>
                      <dd className={CLASE_META_DD}>{formatearFecha(c.fecha_apertura)}</dd>
                    </div>
                    <div>
                      <dt className={CLASE_META_DT}>Cierre</dt>
                      <dd className={CLASE_META_DD}>{formatearFecha(c.fecha_cierre)}</dd>
                      {cierraPronto && (
                        <dd className="mt-0.5 text-xs font-medium text-sena-azul dark:text-sena-texto">
                          {cierraPronto}
                        </dd>
                      )}
                    </div>
                    <div>
                      <dt className={CLASE_META_DT}>Vacantes</dt>
                      <dd className={CLASE_META_DD}>{c.vacantes}</dd>
                    </div>
                    <div>
                      <dt className={CLASE_META_DT}>Documentos</dt>
                      <dd className={CLASE_META_DD}>
                        {documentos.length === 0 ? (
                          'Sin documentos'
                        ) : (
                          <>
                            {documentos.length}
                            <span className="ml-1 text-xs font-normal text-slate-600 dark:text-sena-texto-suave">
                              ·{' '}
                              {obligatorios === documentos.length
                                ? 'todos obligatorios'
                                : obligatorios === 0
                                  ? 'opcionales'
                                  : `${obligatorios} obligatorio${obligatorios === 1 ? '' : 's'}`}
                            </span>
                          </>
                        )}
                      </dd>
                    </div>
                    {gestiona && (
                      <div>
                        <dt className={CLASE_META_DT}>Postulaciones enviadas</dt>
                        <dd className={CLASE_META_DD}>{c.postulantes ?? 0}</dd>
                        <dd className="mt-0.5 text-xs text-slate-600 dark:text-sena-texto-suave">
                          de usuarios activos
                        </dd>
                      </div>
                    )}
                  </dl>

                  {/* 5) Pie: al aspirante le queda el estado de su postulación;
                      debajo, las acciones. */}
                  <div className="mt-auto pt-5">
                    {esAspirante && c.mi_postulacion && (
                      <div className="mb-2 flex flex-wrap items-center gap-2 text-xs text-slate-600 dark:text-sena-texto-suave">
                        <span>Tu postulación</span>
                        <EtiquetaPostulacion
                          codigo={c.mi_postulacion.estado?.codigo}
                          nombre={c.mi_postulacion.estado?.nombre}
                        />
                      </div>
                    )}

                    <div className="flex flex-col gap-2">{renderAcciones(c)}</div>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </div>

      {hayLista && meta.total > 0 && meta.last_page > 1 && (
        <Tarjeta className="px-4 py-3">
          <Paginacion
            meta={meta}
            singular="convocatoria"
            plural="convocatorias"
            etiqueta="Paginación de convocatorias"
            onPagina={irAPagina}
          />
        </Tarjeta>
      )}
    </div>
  )
}
