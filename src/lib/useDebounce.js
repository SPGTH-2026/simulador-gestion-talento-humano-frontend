import { useEffect, useState } from 'react'

// Devuelve el valor tal como queda tras `retraso` ms sin cambios. Sirve para no pedir al servidor en cada tecla.
export default function useDebounce(valor, retraso = 300) {
  const [diferido, setDiferido] = useState(valor)

  useEffect(() => {
    const id = setTimeout(() => setDiferido(valor), retraso)
    return () => clearTimeout(id)
  }, [valor, retraso])

  return diferido
}
