import { useCallback, useEffect, useRef, useState } from 'react'
import { postularse } from '../../api/postulaciones'
import { mensajeError } from '../../api/mensajeError'
import { useLecturaEstado } from './useLecturaEstado'

// Estado de la postulación de documentos: id, estado que devuelve el servidor, error y la creación del borrador silencioso
// (la primera acción de guardado crea la postulación si aún no existe). La lectura con orden y guardas está en
// useLecturaEstado; aquí solo se decide cuándo leer.
export function usePanelEstadoDocumentos({ postulacionId, miPostulacion, convocatoria, onEstadoChange, onPostulacionCreada }) {
  const idInicial = postulacionId ?? miPostulacion?.id ?? null

  const [idPostulacion, setIdPostulacion] = useState(idInicial)
  const [estado, setEstado] = useState(null)
  const [error, setError] = useState('')
  // Promesa de creación en vuelo: una sola creación de borrador a la vez.
  const creandoRef = useRef(null)

  const aplicarEstado = useCallback(
    (data) => {
      setEstado(data)
      onEstadoChange?.(data)
    },
    [onEstadoChange],
  )

  const { leerEstado, registrarCreada, idVigente, yaLeido } = useLecturaEstado(aplicarEstado, idInicial)

  // Estado de la postulación (si existe). Se relee en cada id nuevo, salvo en un borrador recién creado: su estado ya se aplicó.
  useEffect(() => {
    if (!idPostulacion || yaLeido(idPostulacion)) return undefined

    let activo = true
    leerEstado(idPostulacion)
      .then(() => {
        if (activo) setError('')
      })
      .catch((e) => {
        if (activo) setError(mensajeError(e))
      })

    return () => {
      activo = false
    }
  }, [idPostulacion, leerEstado, yaLeido])

  // Relee el estado y deja el error en el panel si falla.
  const releerEstado = useCallback(
    (id) =>
      leerEstado(id)
        .then(() => setError(''))
        .catch((e) => setError(mensajeError(e))),
    [leerEstado],
  )

  // Borrador silencioso: garantiza una postulación y devuelve su id + el estado fresco. Si ya existe (también si está
  // retirada: editar no cambia el estado) no hace nada. Una sola creación en vuelo: si falla, la acción que la pidió
  // muestra el error y NO sube nada.
  const asegurar = useCallback(() => {
    if (idPostulacion) {
      return Promise.resolve({ postulacionId: idPostulacion, estado })
    }
    if (creandoRef.current) return creandoRef.current

    const promesa = (async () => {
      const postulacion = await postularse(convocatoria?.id)
      onPostulacionCreada?.(postulacion)
      // Primero el estado y DESPUÉS el id. Si el id se pone antes, el panel muestra "Cargando tus datos…" mientras llega
      // el estado y desmonta la sección de documentos en plena subida (se perdía el progreso y el archivo).
      const fresco = await leerEstado(postulacion.id).catch(() => null)
      registrarCreada(postulacion.id, Boolean(fresco))
      setIdPostulacion(postulacion.id)
      setError('')
      return { postulacionId: postulacion.id, estado: fresco }
    })().finally(() => {
      creandoRef.current = null
    })

    creandoRef.current = promesa
    return promesa
  }, [idPostulacion, estado, convocatoria, onPostulacionCreada, leerEstado, registrarCreada])

  return { idPostulacion, estado, error, setError, asegurar, idVigente, releerEstado }
}
