import { useCallback, useEffect, useRef, useState } from 'react'
import { decisionesConvocatoria } from '../../api/seleccion'
import { mensajeError } from '../../api/mensajeError'
import useAvisoTransitorio from '../../hooks/useAvisoTransitorio'
import Boton from '../ui/Boton'
import { MensajeError } from '../ui/Mensaje'
import Rueda from '../ui/Rueda'
import { CLASE_TEXTO_SUAVE } from '../../lib/estilos'
import { ESTADO_DECISION, accionesDeFila } from '../../lib/seleccion'

// Lógica de PanelDecisiones: estado, efectos y manejadores. Devuelve todo en un objeto (ctx) para la vista.
export function usePanelDecisiones({ convocatoriaId, enProceso, puedeDecidir }) {
  const [pagina, setPagina] = useState(1)
  const [estado, setEstado] = useState({ fase: 'cargando', filas: [], meta: null, error: '' })
  const [intento, setIntento] = useState(0)
  // Fila con el diálogo de decisión abierto y fila con el detalle (evidencia e historial) abierto (id de la postulación).
  const [decidiendo, setDecidiendo] = useState(null)
  const [detalle, setDetalle] = useState(null)
  // Confirmación de la última decisión guardada ({ texto }); un objeto nuevo en cada guardado reinicia su plazo.
  const [guardada, setGuardada] = useState(null)
  const pausaGuardada = useAvisoTransitorio(guardada, () => setGuardada(null))
  // Los datos se piden con una "foto" de la página: una recarga silenciosa (tras guardar o un 409) no vacía la tabla.
  const solicitud = useRef(0)

  // Aplica una lectura del servidor. El servidor ajusta la página si ya no existe (p. ej. quedaron menos de 20 filas).
  const aplicar = useCallback((res, n) => {
    if (res.meta.current_page !== n) setPagina(res.meta.current_page)
    setEstado({ fase: 'listo', filas: res.data, meta: res.meta, error: '' })
  }, [])
  const fallo = useCallback((e) => setEstado((previo) => ({ ...previo, fase: 'error', error: mensajeError(e) })), [])

  // Carga inicial, cambio de página o reintento. El estado «cargando» ya lo fijaron el estado inicial, cambiarPagina o
  // reintentar; aquí solo se pide y se descarta la respuesta si ya hay otra petición más nueva.
  useEffect(() => {
    const mia = ++solicitud.current
    decisionesConvocatoria(convocatoriaId, { page: pagina })
      .then((res) => {
        if (mia === solicitud.current) aplicar(res, pagina)
      })
      .catch((e) => {
        if (mia === solicitud.current) fallo(e)
      })
    return () => {
      solicitud.current += 1
    }
  }, [convocatoriaId, pagina, intento, aplicar, fallo])

  // Recarga silenciosa (tras guardar o un 409): no vacía la tabla ni muestra «cargando».
  const recargar = () => {
    const mia = ++solicitud.current
    return decisionesConvocatoria(convocatoriaId, { page: pagina })
      .then((res) => {
        if (mia === solicitud.current) aplicar(res, pagina)
      })
      .catch((e) => {
        if (mia === solicitud.current) fallo(e)
      })
  }

  const cambiarPagina = (n) => {
    setDecidiendo(null)
    setDetalle(null)
    setGuardada(null)
    setEstado((previo) => ({ ...previo, fase: 'cargando', error: '' }))
    setPagina(n)
  }
  const reintentar = () => {
    setEstado((previo) => ({ ...previo, fase: 'cargando', error: '' }))
    setIntento((n) => n + 1)
  }

  const { fase, filas, meta, error } = estado
  const cargando = fase === 'cargando'
  const cupos = meta?.cupos
  const lista = meta?.lista ?? null
  // El estado de la convocatoria lo da el servidor con cada lectura; si aún no llegó se usa el del padre.
  const vigenteEnProceso = meta ? meta.estado_convocatoria === 'en_proceso' : enProceso

  const accionesDe = (fila) => accionesDeFila({ fila, puedeDecidir, enProceso: vigenteEnProceso, cupos, lista })
  const filaDecidiendo = decidiendo == null ? null : (filas.find((f) => f.postulacion_id === decidiendo) ?? null)
  const filaDetalle = detalle == null ? null : (filas.find((f) => f.postulacion_id === detalle) ?? null)

  // Tras guardar se aplica lo que devolvió el servidor y se vuelve a leer en silencio: fila, cupos y pendientes salen
  // siempre de la misma lectura.
  const alGuardar = (resultado) => {
    setDecidiendo(null)
    setGuardada({ texto: `Decisión guardada: ${resultado.aspirante ?? 'el candidato'} quedó como ${ESTADO_DECISION[resultado.estado]?.texto.toLowerCase() ?? resultado.estado}.` })
    setEstado((previo) => ({
      ...previo,
      meta: previo.meta ? { ...previo.meta, cupos: resultado.cupos } : previo.meta,
      filas: previo.filas.map((f) =>
        f.postulacion_id === resultado.postulacion_id ? { ...f, estado: resultado.estado, decision: resultado.decision } : f,
      ),
    }))
    return recargar()
  }
  const alConflicto = () => recargar()

  if (fase === 'error' && filas.length === 0) {
    return (
      <div className="flex flex-col items-start gap-3">
        <MensajeError>{error}</MensajeError>
        <Boton variante="contorno" tamano="tactil" onClick={reintentar}>
          Reintentar
        </Boton>
      </div>
    )
  }
  if (!meta) {
    return (
      <p role="status" className={`flex items-center gap-2 py-8 text-sm ${CLASE_TEXTO_SUAVE}`}>
        <Rueda /> Cargando decisiones…
      </p>
    )
  }

  const sinFilas = filas.length === 0

    return {
      accionesDe,
      alConflicto,
      alGuardar,
      aplicar,
      cambiarPagina,
      cargando,
      convocatoriaId,
      cupos,
      decidiendo,
      detalle,
      enProceso,
      error,
      estado,
      fallo,
      fase,
      filaDecidiendo,
      filaDetalle,
      filas,
      guardada,
      intento,
      lista,
      meta,
      pagina,
      pausaGuardada,
      puedeDecidir,
      recargar,
      reintentar,
      setDecidiendo,
      setDetalle,
      setEstado,
      setGuardada,
      setIntento,
      setPagina,
      sinFilas,
      solicitud,
      vigenteEnProceso,
    }
}
