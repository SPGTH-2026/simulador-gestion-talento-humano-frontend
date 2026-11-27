import { useEffect, useState } from 'react'
import useAvisoTransitorio from '../../hooks/useAvisoTransitorio'
import { useLocation, useNavigate } from 'react-router-dom'
import { listaMisPostulaciones, cambiarEstadoPostulacion, descartarPostulacion } from '../../api/postulaciones'
import { mensajeError } from '../../api/mensajeError'
import { useConfirmacion } from '../../hooks/useConfirmacion'
import { estadoVentana } from '../../lib/ventanaPostulacion'

// Lógica de MisPostulaciones: estado, efectos y manejadores. Devuelve todo en un objeto (ctx) para la vista.
export function useMisPostulaciones() {
  const navigate = useNavigate()
  const location = useLocation()
  const [postulaciones, setPostulaciones] = useState([])
  const [meta, setMeta] = useState({})
  const [pagina, setPagina] = useState(1)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  // Mensaje de éxito que llega al volver de enviar la postulación (router state).
  // Es una confirmación breve: se retira sola (con pausa al pasar el puntero o el foco) y no reaparece al recargar.
  const [exito, setExito] = useState(() => (location.state?.exito ? { texto: location.state.exito } : null))
  const pausaExito = useAvisoTransitorio(exito, () => setExito(null))
  useEffect(() => {
    if (location.state?.exito) navigate(location.pathname, { replace: true, state: null })
  }, [location.pathname, location.state, navigate])
  // id de la fila cuya acción está en vuelo (bloquea su botón).
  const [accionandoId, setAccionandoId] = useState(null)
  const [recarga, setRecarga] = useState(0)

  useEffect(() => {
    let activo = true
    listaMisPostulaciones({ page: pagina })
      .then((res) => {
        if (!activo) return
        setPostulaciones(res.data ?? [])
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

  // Descarta un borrador o retira una postulada (mismo destino 'retirada') o
  // reabre una retirada (destino 'borrador'). Devuelve la postulación actualizada
  // o null si falló o el usuario canceló.
  const confirmar = useConfirmacion()

  const cambiarEstado = async (postulacion, destino, accion) => {
    const nombre = postulacion.convocatoria?.nombre ?? 'la convocatoria'
    const opciones = {
      descartar: {
        titulo: 'Descartar borrador',
        mensaje: `¿Estás seguro de descartar tu borrador de postulación a "${nombre}"? Podrás reabrirlo.`,
        textoConfirmar: 'Descartar',
        peligro: true,
      },
      retirar: {
        titulo: 'Retirar postulación',
        mensaje: `¿Estás seguro de retirar tu postulación a "${nombre}"?`,
        textoConfirmar: 'Retirar',
        peligro: true,
      },
      reabrir: {
        titulo: 'Reabrir postulación',
        mensaje: `¿Estás seguro de reabrir tu postulación a "${nombre}"?`,
        textoConfirmar: 'Reabrir',
      },
    }[accion]
    const ok = await confirmar({ textoCancelar: 'Cancelar', ...opciones })
    if (!ok) return null

    setAccionandoId(postulacion.id)
    setError('')
    try {
      const actualizada = await cambiarEstadoPostulacion(postulacion.id, destino)
      // Se actualiza SOLO la fila tocada: la página actual no se pierde.
      setPostulaciones((prev) =>
        prev.map((p) => (p.id === postulacion.id ? { ...p, ...actualizada } : p)),
      )
      return actualizada
    } catch (e) {
      // 422 (retiro con la convocatoria no publicada, reapertura fuera de
      // ventana), 403 y 404 ya vienen en español: se muestran y se resincroniza.
      setError(mensajeError(e))
      setRecarga((n) => n + 1)
      return null
    } finally {
      setAccionandoId(null)
    }
  }

  // Reabrir (retirada -> borrador) y seguir en el paso de documentos.
  const reabrir = async (postulacion) => {
    const actualizada = await cambiarEstado(postulacion, 'borrador', 'reabrir')
    if (actualizada) navigate(`/postulaciones/${postulacion.id}/documentos`)
  }

  // Descartar una postulación RETIRADA cuya convocatoria ya cerró: deja de aparecer en la lista. No borra nada del historial.
  // (Descartar un BORRADOR es otra cosa: lo retira y se puede reabrir; ver cambiarEstado.)
  const descartar = async (postulacion) => {
    const nombre = postulacion.convocatoria?.nombre ?? 'la convocatoria'
    const ok = await confirmar({
      titulo: 'Descartar postulación',
      mensaje: `La convocatoria "${nombre}" ya cerró, así que no puedes reabrir esta postulación. Si la descartas, dejará de aparecer en tu lista. ¿Quieres descartarla?`,
      textoConfirmar: 'Descartar',
      textoCancelar: 'Cancelar',
      peligro: true,
    })
    if (!ok) return false

    setAccionandoId(postulacion.id)
    setError('')
    try {
      await descartarPostulacion(postulacion.id)
      // Sale de la lista al instante; el total del paginado baja uno.
      setPostulaciones((prev) => prev.filter((p) => p.id !== postulacion.id))
      setMeta((prev) => ({ ...prev, total: Math.max((prev.total ?? 1) - 1, 0) }))
      setExito({ texto: 'Postulación descartada: ya no aparece en tu lista.' })
      return true
    } catch (e) {
      // No se recarga la lista: la recarga borraría este mensaje antes de que se lea. La fila sigue ahí y se puede reintentar.
      setError(mensajeError(e))
      return false
    } finally {
      setAccionandoId(null)
    }
  }

  // Ir al paso de documentos de esta postulación (continuar borrador / ver
  // documentos de una postulada).
  const irADocumentos = (postulacion) =>
    navigate(`/postulaciones/${postulacion.id}/documentos`)

  // Datos de una postulación que usan los bloques de arriba.
  const contexto = (postulacion) => {
    const convocatoria = postulacion.convocatoria

    return {
      postulacion,
      publicada: convocatoria?.estado?.codigo === 'publicada',
      ventanaAbierta: estadoVentana(convocatoria) === 'abierta',
      enVuelo: accionandoId === postulacion.id,
      irADocumentos,
      cambiarEstado,
      reabrir,
      descartar,
    }
  }

  const totalPaginas = Math.max(meta.last_page ?? 1, 1)
  const total = meta.total ?? 0

    return {
      accionandoId,
      cambiarEstado,
      cargando,
      confirmar,
      contexto,
      error,
      exito,
      irADocumentos,
      location,
      meta,
      navigate,
      pagina,
      pausaExito,
      postulaciones,
      reabrir,
      recarga,
      setAccionandoId,
      setCargando,
      setError,
      setExito,
      setMeta,
      setPagina,
      setPostulaciones,
      setRecarga,
      total,
      totalPaginas,
    }
}
