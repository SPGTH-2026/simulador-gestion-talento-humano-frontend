import { useEffect, useRef, useState } from 'react'

// Para una región con desplazamiento horizontal propio (una tabla ancha): dice si el contenido NO cabe (`desborda`) y si ya se
// llegó al final (`alFinal`), y se mantiene al día si cambia el ancho (ventana, menú lateral, zoom) o el contenido. Pone `ref` en
// la región y `alDesplazar` en su onScroll.
export default function useDesbordeHorizontal() {
  const ref = useRef(null)
  const [estado, setEstado] = useState({ desborda: false, alFinal: true })

  const medir = () => {
    const region = ref.current
    if (!region) return
    const desborda = region.scrollWidth > region.clientWidth + 1
    const alFinal = region.scrollLeft + region.clientWidth >= region.scrollWidth - 1
    setEstado((previo) => (previo.desborda === desborda && previo.alFinal === alFinal ? previo : { desborda, alFinal }))
  }

  useEffect(() => {
    const region = ref.current
    if (!region || typeof ResizeObserver === 'undefined') return undefined
    const observador = new ResizeObserver(medir)
    observador.observe(region)
    if (region.firstElementChild) observador.observe(region.firstElementChild)
    return () => observador.disconnect()
  }, [])

  return { ref, desborda: estado.desborda, alFinal: estado.alFinal, alDesplazar: medir }
}
