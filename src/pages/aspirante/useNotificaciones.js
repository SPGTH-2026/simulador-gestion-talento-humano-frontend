import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  listaNotificaciones,
  marcarNotificacionLeida,
  marcarTodasNotificacionesLeidas,
} from '../../api/notificaciones'
import { mensajeError } from '../../api/mensajeError'
import { avisarCambioNotificaciones } from '../../components/notificaciones/useContadorNotificaciones'

// Estado de la página de notificaciones: la lista paginada, marcar leídas y abrir el aviso (que lo marca y, si trae
// destino, lleva a esa pantalla).
export function useNotificaciones() {
  const navigate = useNavigate()
  const [items, setItems] = useState([])
  const [meta, setMeta] = useState({})
  const [pagina, setPagina] = useState(1)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [ocupado, setOcupado] = useState(false)
  const [recarga, setRecarga] = useState(0)

  useEffect(() => {
    let activo = true
    listaNotificaciones({ page: pagina })
      .then((res) => {
        if (!activo) return
        setItems(res.data ?? [])
        setMeta(res.meta ?? {})
        setError('')
      })
      .catch((e) => {
        if (activo) setError(mensajeError(e))
      })
      .finally(() => {
        if (activo) setCargando(false)
      })
    return () => {
      activo = false
    }
  }, [pagina, recarga])

  const recargar = useCallback(() => setRecarga((n) => n + 1), [])

  const marcarLeida = useCallback(async (notificacion) => {
    if (notificacion.leida) return
    try {
      const actualizada = await marcarNotificacionLeida(notificacion.id)
      setItems((prev) => prev.map((n) => (n.id === actualizada.id ? actualizada : n)))
      avisarCambioNotificaciones()
    } catch (e) {
      setError(mensajeError(e))
    }
  }, [])

  // Abrir un aviso: se marca como leído y, si tiene destino, se navega a él.
  const abrir = async (notificacion) => {
    await marcarLeida(notificacion)
    if (notificacion.url) navigate(notificacion.url)
  }

  const marcarTodas = async () => {
    if (ocupado) return
    setOcupado(true)
    setError('')
    try {
      await marcarTodasNotificacionesLeidas()
      avisarCambioNotificaciones()
      recargar()
    } catch (e) {
      setError(mensajeError(e))
    } finally {
      setOcupado(false)
    }
  }

  return {
    abrir,
    cargando,
    error,
    items,
    marcarTodas,
    meta,
    noLeidas: meta.no_leidas ?? 0,
    ocupado,
    setPagina,
  }
}
