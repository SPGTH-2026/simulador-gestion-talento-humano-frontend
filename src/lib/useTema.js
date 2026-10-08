import { useCallback, useEffect, useState } from 'react'

const CLAVE = 'spgth-tema'

function preferenciaGuardada() {
  try {
    return localStorage.getItem(CLAVE)
  } catch {
    return null
  }
}

function aplicar(oscuro) {
  document.documentElement.classList.toggle('dark', oscuro)
  // Hace que los controles nativos y las barras del sistema tambien se
  // pinten oscuros; sin esto el tema queda a medias en inputs del navegador.
  document.documentElement.style.colorScheme = oscuro ? 'dark' : 'light'
}

// El script de index.html ya aplico la clase antes de montar React. Aqui se
// parte de lo que hay en el DOM en vez de recalcularlo, para que la app y el
// HTML inicial nunca discrepen.
export function useTema() {
  const [oscuro, setOscuro] = useState(() =>
    document.documentElement.classList.contains('dark'),
  )
  const [siguiendo, setSiguiendo] = useState(() => preferenciaGuardada() === null)

  // Mientras no haya eleccion manual, el cambio del sistema debe verse.
  useEffect(() => {
    if (!siguiendo) return

    const medio = window.matchMedia('(prefers-color-scheme: dark)')
    const alCambiar = (e) => {
      setOscuro(e.matches)
      aplicar(e.matches)
    }
    medio.addEventListener('change', alCambiar)
    return () => medio.removeEventListener('change', alCambiar)
  }, [siguiendo])

  const alternar = useCallback(() => {
    setOscuro((actual) => {
      const nuevo = !actual
      aplicar(nuevo)
      try {
        localStorage.setItem(CLAVE, nuevo ? 'oscuro' : 'claro')
      } catch {
        /* sin persistencia, el tema funciona igual mientras la pagina viva */
      }
      return nuevo
    })
    setSiguiendo(false)
  }, [])

  return { oscuro, alternar, siguiendo }
}
