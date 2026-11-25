import { useCallback, useEffect, useState } from 'react'
import { citacionesDeCandidato } from '../../../api/citaciones'
import { mensajeError } from '../../../api/mensajeError'

// Citaciones de UN candidato. 'datos' es null mientras no hay respuesta; ante un fallo se conserva lo último y se informa el error.
// 'recargar' vuelve a pedir sin vaciar la pantalla (tras programar, reprogramar o cancelar).
export function useCitacionesCandidato(convocatoriaId, postulacionId) {
  const [datos, setDatos] = useState(null)
  const [error, setError] = useState('')
  const [intento, setIntento] = useState(0)

  useEffect(() => {
    let vigente = true
    citacionesDeCandidato(convocatoriaId, postulacionId)
      .then((res) => {
        if (!vigente) return
        setDatos(res.data)
        setError('')
      })
      .catch((e) => {
        if (vigente) setError(mensajeError(e))
      })
    return () => {
      vigente = false
    }
  }, [convocatoriaId, postulacionId, intento])

  const recargar = useCallback(() => setIntento((n) => n + 1), [])
  return { datos, error, recargar }
}
