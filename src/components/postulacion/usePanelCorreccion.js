import { useCallback, useEffect, useMemo, useState } from 'react'
import { obtenerCorreccion, enviarCorreccion } from '../../api/postulacionesDocumentos'
import { mensajeError } from '../../api/mensajeError'

// Corrección que pidió el evaluador: en qué ronda están los documentos marcados, cuáles ya se reemplazaron y si se puede
// enviar. Solo aplica al aspirante; para los demás roles no hay corrección.
export function usePanelCorreccion({ idPostulacion, rol, onCorreccionEnviada, setError }) {
  // Respuesta del servidor sobre la corrección (null si no hay ninguna pendiente).
  const [correccion, setCorreccion] = useState(null)
  const [enviandoCorreccion, setEnviandoCorreccion] = useState(false)

  useEffect(() => {
    let activo = true
    if (!idPostulacion || rol !== 'aspirante') return undefined
    obtenerCorreccion(idPostulacion)
      .then((c) => {
        if (activo) setCorreccion(c)
      })
      .catch(() => {})
    return () => {
      activo = false
    }
  }, [idPostulacion, rol])

  // Salen de la RONDA actual (la fija el servidor): los marcados al pedirla y los que ya cambiaron de archivo desde entonces.
  // Un archivo que ya existía antes de la solicitud no cuenta como corregido.
  const ronda = correccion?.correccion?.ronda_actual ?? null
  const marcados = useMemo(() => new Set((ronda?.documentos_marcados ?? []).map(Number)), [ronda])
  const reemplazados = useMemo(() => new Set((ronda?.documentos_reemplazados ?? []).map(Number)), [ronda])
  const infoCorreccion = correccion ? { marcados, reemplazados } : null
  // La vigencia la decide el servidor (estado de la ronda): pedida, sin responder, con plazo y postulación activos. La
  // pantalla no la recalcula, así coincide siempre con lo que el servidor va a aceptar.
  const correccionVigente = ronda?.estado === 'vigente'
  const corregidos = [...marcados].filter((id) => reemplazados.has(id)).length

  const enviarCorreccionAhora = useCallback(async () => {
    setEnviandoCorreccion(true)
    setError('')
    try {
      await enviarCorreccion(idPostulacion)
      onCorreccionEnviada?.()
    } catch (e) {
      setError(mensajeError(e))
    } finally {
      setEnviandoCorreccion(false)
    }
  }, [idPostulacion, onCorreccionEnviada, setError])

  // Se relee JUNTO con el estado del documento: así «N de M corregidos» y el botón de enviar cambian a la vez.
  const releerCorreccion = useCallback(
    (id) =>
      rol === 'aspirante'
        ? obtenerCorreccion(id)
            .then(setCorreccion)
            .catch(() => {})
        : Promise.resolve(),
    [rol],
  )

  return {
    correccion,
    marcados,
    infoCorreccion,
    correccionVigente,
    corregidos,
    enviandoCorreccion,
    enviarCorreccionAhora,
    releerCorreccion,
  }
}
