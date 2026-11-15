import { useEffect, useMemo, useRef, useState } from 'react'

// Confirmación breve que se retira sola: pasados 'ms' llama a 'alExpirar' (que debe quitar el mensaje). Es para los
// avisos de éxito o de información; los avisos que requieren atención y los errores NO la usan y siguen visibles.
//  - 'mensaje': lo que se muestra (null = nada). Un mensaje NUEVO reinicia el plazo, también si el texto es igual: por
//    eso se espera un objeto distinto en cada aviso, no un texto suelto.
//  - Mientras el puntero o el foco estén sobre el mensaje el plazo se detiene, para que se pueda leer con calma
//    (WCAG 2.2.1). La pausa pertenece a ESE mensaje: si se retira o llega otro, no se arrastra. Devuelve los
//    manejadores para ponerlos en el contenedor del mensaje: <div {...pausa}>.
//  - El mensaje debe seguir siendo role="status": el lector de pantalla lo anuncia al aparecer; al retirarse no dice nada.
export default function useAvisoTransitorio(mensaje, alExpirar, ms = 6000) {
  const [pausadoCon, setPausadoCon] = useState(null)
  const pausado = mensaje != null && pausadoCon === mensaje
  const expirar = useRef(alExpirar)
  useEffect(() => {
    expirar.current = alExpirar
  })

  useEffect(() => {
    if (!mensaje || pausado) return undefined
    const temporizador = setTimeout(() => expirar.current(), ms)
    return () => clearTimeout(temporizador)
  }, [mensaje, pausado, ms])

  return useMemo(
    () => ({
      onMouseEnter: () => setPausadoCon(mensaje),
      onMouseLeave: () => setPausadoCon(null),
      onFocus: () => setPausadoCon(mensaje),
      onBlur: () => setPausadoCon(null),
    }),
    [mensaje],
  )
}
