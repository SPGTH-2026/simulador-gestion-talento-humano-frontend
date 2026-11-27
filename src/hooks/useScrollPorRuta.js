import { useEffect, useLayoutEffect, useRef } from 'react'
import { useLocation, useNavigationType } from 'react-router-dom'

// Posición del contenido al cambiar de pantalla. El contenedor con desplazamiento propio del marco no se recrea al navegar, así que
// la posición no la gestiona el navegador:
//  - Pantalla nueva (enlace o menú): empieza arriba (antes heredaba la posición de la anterior y abría a mitad de página).
//  - Atrás/adelante del navegador: recupera la posición que esa entrada tenía al salir.
//  - Regreso a la pantalla de la que se venía (p. ej. «Volver al listado» desde un detalle): recupera su posición.
//  - Cambios que solo modifican la búsqueda (filtros, pestañas, páginas) no tocan la posición.
// La pantalla destino puede tardar en cargar: se reintenta mientras llega el contenido (hasta 10 s: la API puede tardar) y se abandona en cuanto la
// persona toca, rueda o pulsa una tecla, para no competir con su desplazamiento.
const ESPERA_MAXIMA_MS = 10000
const SONDEO_MS = 60
const MAXIMO_ENTRADAS = 60
const EVENTOS_DEL_USUARIO = ['wheel', 'touchstart', 'pointerdown', 'keydown']

export default function useScrollPorRuta(idContenedor = 'contenido') {
  const { pathname, search, key } = useLocation()
  const tipo = useNavigationType()
  const posiciones = useRef(new Map()) // clave de la entrada del historial -> posición al salir
  const actual = useRef({ key, pathname, ruta: pathname + search })
  const previa = useRef(null) // pantalla de la que se venía: { pathname, ruta, top }
  const cancelar = useRef(() => {})

  // Registra la posición de la entrada actual mientras la persona se desplaza.
  useEffect(() => {
    const contenedor = document.getElementById(idContenedor)
    if (!contenedor) return undefined
    const alDesplazar = () => {
      posiciones.current.set(actual.current.key, contenedor.scrollTop)
      if (posiciones.current.size > MAXIMO_ENTRADAS) posiciones.current.delete(posiciones.current.keys().next().value)
    }
    contenedor.addEventListener('scroll', alDesplazar, { passive: true })
    return () => contenedor.removeEventListener('scroll', alDesplazar)
  }, [idContenedor])

  useLayoutEffect(() => {
    const anterior = actual.current
    if (anterior.key === key) return undefined
    const topAnterior = posiciones.current.get(anterior.key) ?? 0
    actual.current = { key, pathname, ruta: pathname + search }
    cancelar.current()
    // Misma pantalla con otra búsqueda: la posición se conserva.
    if (anterior.pathname === pathname) return undefined

    const volviendo = tipo === 'POP' || (previa.current && previa.current.ruta === pathname + search)
    const destino = tipo === 'POP' ? (posiciones.current.get(key) ?? 0) : volviendo ? previa.current.top : 0
    previa.current = { pathname: anterior.pathname, ruta: anterior.ruta, top: topAnterior }

    const contenedor = document.getElementById(idContenedor)
    if (!contenedor) return undefined
    if (destino <= 0) {
      contenedor.scrollTop = 0
      return undefined
    }
    // Recuperar: esperar a que el contenido sea lo bastante alto.
    let fin = false
    let temporizador = null
    const inicio = Date.now()
    const parar = () => {
      fin = true
      clearTimeout(temporizador)
      EVENTOS_DEL_USUARIO.forEach((e) => contenedor.removeEventListener(e, parar))
    }
    cancelar.current = parar
    EVENTOS_DEL_USUARIO.forEach((e) => contenedor.addEventListener(e, parar, { passive: true }))
    const intentar = () => {
      if (fin) return
      const maximo = contenedor.scrollHeight - contenedor.clientHeight
      if (maximo >= destino - 1 || Date.now() - inicio > ESPERA_MAXIMA_MS) {
        contenedor.scrollTop = Math.min(destino, Math.max(maximo, 0))
        parar()
        return
      }
      temporizador = setTimeout(intentar, SONDEO_MS)
    }
    intentar()
    return undefined
  }, [key, pathname, search, tipo, idContenedor])

  useEffect(() => () => cancelar.current(), [])
}
