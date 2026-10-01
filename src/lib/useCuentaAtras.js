import { useCallback, useEffect, useState } from 'react'

// Cuenta atrás para los botones que reintentos tras un 429, usando la cabecera
// Retry-After del backend. Con segundos = 0 el botón vuelve a estar disponible.
export function useCuentaAtras() {
  const [segundos, setSegundos] = useState(0)

  useEffect(() => {
    if (segundos <= 0) return

    const id = setTimeout(() => setSegundos((s) => Math.max(0, s - 1)), 1000)
    return () => clearTimeout(id)
  }, [segundos])

  const iniciar = useCallback((n) => {
    setSegundos(Number.isFinite(n) && n > 0 ? Math.ceil(n) : 0)
  }, [])

  return { segundos, iniciar, bloqueado: segundos > 0 }
}