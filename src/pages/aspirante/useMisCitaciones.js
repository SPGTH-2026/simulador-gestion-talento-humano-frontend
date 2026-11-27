import { useEffect, useState } from 'react'
import { misCitaciones } from '../../api/citaciones'
import { mensajeError } from '../../api/mensajeError'

// Las citaciones del propio aspirante. 'citas' es null mientras carga; un fallo no bloquea el resto de «Mis postulaciones».
export function useMisCitaciones() {
  const [citas, setCitas] = useState(null)
  const [error, setError] = useState('')
  const [intento, setIntento] = useState(0)

  useEffect(() => {
    let vigente = true
    misCitaciones()
      .then((res) => {
        if (!vigente) return
        setCitas(res.data)
        setError('')
      })
      .catch((e) => {
        if (vigente) setError(mensajeError(e))
      })
    return () => {
      vigente = false
    }
  }, [intento])

  return { citas, error, reintentar: () => setIntento((n) => n + 1) }
}
