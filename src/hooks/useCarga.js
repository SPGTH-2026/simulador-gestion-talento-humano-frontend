import { useCallback, useEffect, useRef, useState } from 'react'
import { mensajeError } from '../api/mensajeError'

// Carga un recurso una vez, con estado de carga, error y reintento. Solo pide
// si 'activo' es true (por permisos y rol). Una respuesta que llega después de
// desmontar o de reintentar se descarta: 'vigente' es de ESA petición. Quien
// la use debe montarla con 'key' propia del usuario para que, al cambiar de
// cuenta, el estado empiece de cero.
export function useCarga(cargar, activo) {
  const [estado, setEstado] = useState({ fase: 'cargando', datos: null, error: '' })
  const [intento, setIntento] = useState(0)

  // El cargador se guarda en una ref para no repetir la petición cada vez que
  // el componente crea una función nueva.
  const cargador = useRef(cargar)
  useEffect(() => {
    cargador.current = cargar
  })

  useEffect(() => {
    if (!activo) return undefined
    let vigente = true

    cargador
      .current()
      .then((datos) => {
        if (vigente) setEstado({ fase: 'listo', datos, error: '' })
      })
      .catch((err) => {
        if (vigente) setEstado({ fase: 'error', datos: null, error: mensajeError(err) })
      })

    return () => {
      vigente = false
    }
  }, [activo, intento])

  const reintentar = useCallback(() => {
    setEstado({ fase: 'cargando', datos: null, error: '' })
    setIntento((n) => n + 1)
  }, [])

  return { ...estado, reintentar }
}
