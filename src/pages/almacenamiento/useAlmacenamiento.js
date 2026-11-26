import { useCallback, useEffect, useState } from 'react'
import { obtenerResumenAlmacenamiento } from '../../api/almacenamiento'
import { mensajeError } from '../../api/mensajeError'

// Resumen de almacenamiento: la base (solo super admin) y, por ficha, documentos y espacio en el disco.
export function useAlmacenamiento() {
  const [datos, setDatos] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [recarga, setRecarga] = useState(0)

  useEffect(() => {
    let activo = true
    obtenerResumenAlmacenamiento()
      .then((data) => {
        if (!activo) return
        setDatos(data)
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
  }, [recarga])

  const recargar = useCallback(() => {
    setCargando(true)
    setRecarga((n) => n + 1)
  }, [])

  return { datos, cargando, error, recargar }
}
