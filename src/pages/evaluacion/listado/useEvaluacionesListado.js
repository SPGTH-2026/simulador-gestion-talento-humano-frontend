import { useEffect, useState } from 'react'
import { useAuth } from '../../../auth/useAuth'
import { listaEvaluaciones } from '../../../api/evaluaciones'
import { mensajeError } from '../../../api/mensajeError'

// Lógica del listado de evaluaciones: filtros (búsqueda, ficha, convocatoria y página), la consulta al servidor
// (las respuestas viejas se descartan), el refresco del avance de los evaluadores y el resumen de filtros activos.
export function useEvaluacionesListado() {
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

  return {
    actualizando, cargando, error, filas, filtroConvocatoria, filtroFicha, filtrosActivos, filtrosAbiertos,
    filtrosDelPanel, hayFilas, limpiarFiltros, mostrarTotal, meta, opcionesConvocatoria, opcionesFicha,
    puedeFiltrarPorFicha, elegirConvocatoria, elegirFicha, setFiltrosAbiertos, setPagina, setTermino,
    termino, verEsqueleto, verVacio,
  }
}
