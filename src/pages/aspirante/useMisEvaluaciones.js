import { useCallback, useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import useAvisoTransitorio from '../../hooks/useAvisoTransitorio'
import { useAuth } from '../../auth/useAuth'
import { misEvaluaciones } from '../../api/evaluaciones'
import { mensajeError } from '../../api/mensajeError'
import client from '../../api/client'

export const POR_PAGINA = 12

// Lógica de MisEvaluaciones: estado, efectos y manejadores. Devuelve todo en un objeto (ctx) para la vista.
export function useMisEvaluaciones() {
  const { can } = useAuth()
  const location = useLocation()
  // Aviso que llega desde otra página (p. ej. tras enviar la corrección).
  // Confirmación breve: se retira sola (con pausa al pasar el puntero o el foco) y no reaparece al recargar.
  const navigate = useNavigate()
  const [exito, setExito] = useState(() => (location.state?.exito ? { texto: location.state.exito } : null))
  const pausaExito = useAvisoTransitorio(exito, () => setExito(null))
  useEffect(() => {
    if (location.state?.exito) navigate(location.pathname, { replace: true, state: null })
  }, [location.pathname, location.state, navigate])
  const [evaluaciones, setEvaluaciones] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [pagina, setPagina] = useState(1)
  const inicioLista = useRef(null)
  const [detalle, setDetalle] = useState(null)
  const [documentos, setDocumentos] = useState([])
  // 'cargando' | 'listo' | 'error': los documentos del detalle.
  const [estadoDocumentos, setEstadoDocumentos] = useState('listo')

  const cargar = useCallback(
    () =>
      misEvaluaciones()
        .then((res) => {
          // Una respuesta sin lista no debe tumbar la pantalla: se trata como «sin evaluaciones».
          setEvaluaciones(Array.isArray(res?.data) ? res.data : [])
          setError('')
        })
        .catch((e) => setError(mensajeError(e)))
        .finally(() => setCargando(false)),
    [],
  )

  useEffect(() => {
    cargar()
  }, [cargar])

  // Refresco automático: el instructor o super admin ve las evaluaciones nuevas
  // de los evaluadores sin recargar. Es silencioso (no vuelve a mostrar la
  // carga) y solo corre con la pestaña a la vista.
  useEffect(() => {
    const actualizar = () => {
      if (document.visibilityState === 'visible') cargar()
    }
    const intervalo = setInterval(actualizar, 10000)
    document.addEventListener('visibilitychange', actualizar)
    window.addEventListener('focus', actualizar)
    return () => {
      clearInterval(intervalo)
      document.removeEventListener('visibilitychange', actualizar)
      window.removeEventListener('focus', actualizar)
    }
  }, [cargar])

  // La API entrega todas las evaluaciones; se muestran POR_PAGINA a la vez para que la página no
  // crezca sin límite. 12 se reparte exacto en 1, 2 y 3 columnas. Si el refresco automático deja
  // menos páginas que la actual, se muestra la última.
  const totalPaginas = Math.max(1, Math.ceil(evaluaciones.length / POR_PAGINA))
  const paginaActual = Math.min(pagina, totalPaginas)
  const visibles = evaluaciones.slice((paginaActual - 1) * POR_PAGINA, paginaActual * POR_PAGINA)
  const irAPagina = (n) => {
    setPagina(n)
    inicioLista.current?.scrollIntoView({ block: 'start' })
  }

  const reintentar = () => {
    setCargando(true)
    setError('')
    cargar()
  }

  const verDetalle = async (e) => {
    setDetalle(e)
    setDocumentos([])
    if (!e?.postulacion_id) {
      setEstadoDocumentos('listo')
      return
    }
    setEstadoDocumentos('cargando')
    const url = can('documentos:ver')
      ? `/revision/postulaciones/${e.postulacion_id}/documentos`
      : `/postulaciones/${e.postulacion_id}/documentos`
    try {
      const res = await client.get(url)
      const payload = res.data?.data ?? res.data ?? {}
      setDocumentos(
        (payload.documentos ?? [])
          .filter((d) => d.parametro?.nombre)
          .map((d) => ({
            id: `doc-${d.parametro.id}`,
            nombre: d.parametro.nombre,
            // Peso del documento en esta convocatoria (null = sin configurar).
            ponderacion: d.ponderacion != null ? Number(d.ponderacion) : null,
            estado: d.estado,
          })),
      )
      setEstadoDocumentos('listo')
    } catch {
      setEstadoDocumentos('error')
    }
  }

    return {
      can,
      cargando,
      cargar,
      detalle,
      documentos,
      error,
      estadoDocumentos,
      evaluaciones,
      exito,
      inicioLista,
      irAPagina,
      location,
      navigate,
      pagina,
      paginaActual,
      pausaExito,
      reintentar,
      setCargando,
      setDetalle,
      setDocumentos,
      setError,
      setEstadoDocumentos,
      setEvaluaciones,
      setExito,
      setPagina,
      totalPaginas,
      verDetalle,
      visibles,
    }
}
