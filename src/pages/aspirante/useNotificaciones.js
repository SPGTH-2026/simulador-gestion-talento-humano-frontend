import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { listaNotificaciones } from '../../api/notificaciones'
import { mensajeError } from '../../api/mensajeError'
import { FILTRO_PREDETERMINADO, alinearContadores, marcarTodasLeidas, useAlmacenNotificaciones } from '../../components/notificaciones/almacenNotificaciones'
import { useAccionesAviso } from '../../components/notificaciones/useAccionesAviso'
import { FILTROS_VALIDOS } from '../../lib/notificaciones'

// Estado de la página de notificaciones. El filtro inicial sale de «?filtro=» (todas | no_leidas | leidas | ocultas); sin él o con un valor
// inválido entra en «No leídas». El historial paginado POR FILTRO en el servidor (todas, no leídas, leídas u ocultas), leer, abrir,
// ocultar y restaurar. Contadores y cambios se comparten con la campana y su panel (almacén). Cambiar de filtro vuelve a la página 1; si
// ocultar o restaurar deja vacía una página posterior se vuelve a una válida; una respuesta tardía de otro filtro o página se descarta.
export function useNotificaciones() {
  const compartido = useAlmacenNotificaciones()
  const [params, setParams] = useSearchParams()
  const pedido = params.get('filtro')
  const filtro = FILTROS_VALIDOS.includes(pedido) ? pedido : FILTRO_PREDETERMINADO
  // La página pertenece a un filtro: si el filtro cambia (también por un enlace «?filtro=»), se vuelve a la 1 sin efectos.
  const [paginaDe, setPaginaDe] = useState({ filtro, pagina: 1 })
  const pagina = paginaDe.filtro === filtro ? paginaDe.pagina : 1
  const setPagina = useCallback((n) => setPaginaDe({ filtro, pagina: n }), [filtro])
  const [lista, setLista] = useState({ items: [], meta: {}, clave: null })
  const [error, setError] = useState('')
  const [ocupado, setOcupado] = useState(false)
  const [recarga, setRecarga] = useState(0)
  const clave = `${filtro}|${pagina}`

  useEffect(() => {
    let activo = true
    listaNotificaciones({ page: pagina, estado: filtro })
      .then((res) => {
        if (!activo) return
        const ultima = res.meta?.last_page ?? 1
        if (pagina > ultima) return setPagina(ultima) // la página quedó vacía: vuelve a una válida
        setLista({ items: res.data ?? [], meta: res.meta ?? {}, clave: `${filtro}|${pagina}` })
        alinearContadores({ noLeidas: res.meta?.no_leidas ?? 0, ocultas: res.meta?.ocultas ?? 0 })
        setError('')
      })
      .catch((e) => {
        if (activo) setError(mensajeError(e))
      })
    return () => {
      activo = false
    }
  }, [filtro, pagina, recarga, setPagina])

  // Al actualizar o reintentar se conservan los avisos ya visibles; solo la primera carga de un filtro o página muestra el esqueleto.
  const recargar = useCallback(() => {
    setError('')
    setRecarga((n) => n + 1)
  }, [])
  // El filtro vive en la URL: un enlace con «?filtro=» se respeta y «atrás» vuelve al filtro anterior. Cambiarlo reinicia la página.
  const cambiarFiltro = (nuevo) => {
    if (nuevo === filtro) return
    setError('')
    setParams({ filtro: nuevo })
  }

  const acciones = useAccionesAviso({ alCambiarVisibilidad: recargar })

  // Lo hecho desde el panel (o aquí) se refleja sin volver a pedir la lista. Ocultar y restaurar son inmediatos: la fila sale de la vista que
  // ya no le corresponde (Ocultas o las demás) y luego se vuelve a pedir la página real (cambia el conjunto y la paginación).
  const items = useMemo(
    () =>
      lista.items
        .map((n) => (compartido.cambios[n.id] ? { ...n, ...compartido.cambios[n.id] } : n))
        .filter((n) => (filtro === 'ocultas' ? n.oculta : !n.oculta)),
    [lista.items, compartido.cambios, filtro],
  )

  const marcarTodas = async () => {
    if (ocupado) return
    setOcupado(true)
    setError('')
    try {
      await marcarTodasLeidas()
      recargar()
    } catch (e) {
      setError(mensajeError(e))
    } finally {
      setOcupado(false)
    }
  }

  return {
    acciones,
    cambiarFiltro,
    cargando: lista.clave !== clave && !error,
    error: error || acciones.errorAccion,
    filtro,
    items: lista.clave === clave ? items : [],
    marcarTodas,
    meta: lista.meta,
    noLeidas: compartido.noLeidas,
    ocultas: compartido.ocultas,
    ocupado,
    pagina,
    recargar,
    setPagina,
  }
}
