import { useEffect, useRef, useState } from 'react'
import { listaConvocatorias, listaParametros } from '../../../api/convocatorias'
import { listaFichas } from '../../../api/fichas'
import { mensajeError } from '../../../api/mensajeError'
import { movimientoReducido, TARJETAS_POR_PAGINA } from './constantesListado'

// Datos del listado: la consulta al servidor (cada cambio de filtros es una consulta nueva), los catálogos
// de los filtros, la paginación y los estados de carga. Recibe los filtros de useFiltrosListado.
export function useDatosListado(filtros, puedeFiltrarFicha) {
  const { pagina, busqueda, filtroEstado, filtroFicha, filtroTipo, filtroModalidad, orden, termino, setValores } = filtros

  const [convocatorias, setConvocatorias] = useState([])
  const [fichas, setFichas] = useState([])
  const [opcionesEstado, setOpcionesEstado] = useState([])
  const [opcionesTipo, setOpcionesTipo] = useState([])
  const [opcionesModalidad, setOpcionesModalidad] = useState([])
  const [meta, setMeta] = useState({ current_page: 1, last_page: 1, total: 0 })

  const [recarga, setRecarga] = useState(0)
  const [cargando, setCargando] = useState(true)
  const [errorConsulta, setErrorConsulta] = useState(null)
  // De qué búsqueda, filtros y página son los datos que hay en pantalla. Si una
  // consulta falla, la lista anterior solo se conserva cuando es la de la misma
  // búsqueda (por ejemplo, al releer tras cerrar una convocatoria): mostrar bajo
  // un error las tarjetas de otra búsqueda confundiría.
  const [datosDe, setDatosDe] = useState(null)
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
      per_page: TARJETAS_POR_PAGINA,
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

  const totalTexto = `${meta.total} ${meta.total === 1 ? 'convocatoria' : 'convocatorias'}`

  return {
    convocatorias, fichas, opcionesEstado, opcionesTipo, opcionesModalidad, meta, setRecarga,
    error, buscando, verEsqueleto, verVacio, hayLista, hayConvocatorias, mostrarTotal, totalTexto,
    refResultados, irAPagina,
  }
}
