import { useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'

// Filtros de un listado guardados en la URL (?q=&estado=&ficha=...).
// Así sobreviven a recargar la página y el enlace se puede compartir.
//
// 'claves' define qué parámetros acepta el listado; cualquier otro se ignora.
// Un valor vacío quita el parámetro de la URL (no deja ?estado= colgando).
// Cambiar un filtro usa replace: no llena el historial del navegador.
export default function useFiltrosUrl(claves) {
  const [params, setParams] = useSearchParams()

  const valores = useMemo(() => {
    const salida = {}
    for (const clave of claves) salida[clave] = params.get(clave) ?? ''
    return salida
    // 'claves' es un array constante en cada pantalla; la clave de dependencia es su contenido.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params, claves.join('|')])

  const setValor = useCallback(
    (clave, valor) => {
      setParams(
        (previo) => {
          const siguiente = new URLSearchParams(previo)
          if (valor === '' || valor == null) siguiente.delete(clave)
          else siguiente.set(clave, String(valor))
          return siguiente
        },
        { replace: true },
      )
    },
    [setParams],
  )

  const limpiar = useCallback(() => {
    setParams(
      (previo) => {
        const siguiente = new URLSearchParams(previo)
        for (const clave of claves) siguiente.delete(clave)
        return siguiente
      },
      { replace: true },
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setParams, claves.join('|')])

  return { valores, setValor, limpiar }
}
