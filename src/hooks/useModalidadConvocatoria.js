import { useCallback, useEffect, useState } from 'react'
import { obtenerConfiguracion } from '../api/seleccion'

// Modalidad de actividades (la configuración de Selección) de la convocatoria elegida, para mostrarla en la cabecera de las tres
// pantallas. Sigue al ID: lo guardado lleva su ID y solo vale mientras la elegida sea esa, así que una respuesta lenta de otra
// convocatoria nunca se ve en la actual. 'recargar' relee sin vaciar lo que ya se muestra (p. ej. tras guardar la configuración).
// Devuelve { fase: 'cargando' | 'listo' | 'error', configurada, opcion, recargar }.
export default function useModalidadConvocatoria(id) {
  const [lectura, setLectura] = useState({ id: null, fase: 'cargando', config: null })
  const [intento, setIntento] = useState(0)

  useEffect(() => {
    if (!id) return undefined
    let vigente = true
    obtenerConfiguracion(id)
      .then((res) => {
        if (vigente) setLectura({ id: String(id), fase: 'listo', config: res.data })
      })
      .catch(() => {
        if (vigente) setLectura({ id: String(id), fase: 'error', config: null })
      })
    return () => {
      vigente = false
    }
  }, [id, intento])

  const recargar = useCallback(() => setIntento((n) => n + 1), [])
  const propia = id && lectura.id === String(id) ? lectura : null

  return {
    fase: propia?.fase ?? 'cargando',
    configurada: Boolean(propia?.config?.configurada),
    opcion: propia?.config?.opcion ?? null,
    recargar,
  }
}
