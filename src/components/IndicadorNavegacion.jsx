import { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'

// Espera tras la cual se muestra la barra. Si la pantalla llega antes (lo normal
// con buena conexión) no aparece nada: evita un parpadeo en cada clic.
const RETRASO_MS = 150
// Si la navegación nunca termina (código que no llega, error), se retira sola.
const LIMITE_MS = 20000

// Quita la marca de "en curso" del enlace pulsado.
function soltar(referencia) {
  const a = referencia.current
  if (!a) return
  delete a.dataset.navegando
  a.removeAttribute('aria-busy')
  referencia.current = null
}

// Retroalimentación al navegar. Las pantallas se cargan por demanda y React
// Router conserva la pantalla anterior a la vista mientras llega la nueva: con
// una conexión lenta el clic parecía no hacer nada. Mientras dura la espera:
//  - una barra fina de progreso arriba (si pasan más de 150 ms);
//  - el enlace pulsado queda marcado con data-navegando (cursor de espera y
//    algo más tenue) y aria-busy;
//  - un aviso para lectores de pantalla ("Cargando pantalla...").
// Se detecta el clic en enlaces internos que React Router ya gestionó
// (defaultPrevented). Las navegaciones hechas por código (navigate) no pasan
// por aquí; las pantallas siguen mostrando sus propios estados de carga.
export default function IndicadorNavegacion() {
  const { key, pathname, search } = useLocation()
  // Ubicación en la que se pulsó el enlace. La espera dura mientras la
  // ubicación siga siendo esa: cuando la navegación termina, 'key' cambia y
  // 'pendiente' deja de cumplirse sin necesidad de un efecto que lo apague.
  const [esperaDesde, setEsperaDesde] = useState(null)
  const [visible, setVisible] = useState(false)
  const enlace = useRef(null)
  const pendiente = esperaDesde !== null && esperaDesde === key

  useEffect(() => {
    const alPulsar = (evento) => {
      // En fase de burbuja: React Router ya manejó el enlace y llamó a
      // preventDefault. Un clic con Ctrl/Cmd, en otra pestaña o a otro sitio no.
      if (!evento.defaultPrevented || evento.button !== 0) return
      const a = evento.target instanceof Element ? evento.target.closest('a[href]') : null
      if (!a || a.target === '_blank' || a.hasAttribute('download')) return
      const destino = new URL(a.href, window.location.href)
      if (destino.origin !== window.location.origin) return
      // Se compara con la ubicación que React Router tiene confirmada ('pathname'
      // y 'search' de useLocation) y no con window.location: al llegar aquí el
      // navegador ya cambió la dirección, pero la pantalla sigue siendo la
      // anterior hasta que la nueva termina de cargar.
      if (destino.pathname === pathname && destino.search === search) return

      soltar(enlace)
      enlace.current = a
      a.dataset.navegando = 'true'
      a.setAttribute('aria-busy', 'true')
      setEsperaDesde(key)
    }
    document.addEventListener('click', alPulsar)
    return () => document.removeEventListener('click', alPulsar)
  }, [key, pathname, search])

  // Mientras hay una navegación pendiente: la barra aparece tras el retraso y se
  // retira sola pasado el límite. Al terminar (o al desmontar) se limpia todo.
  useEffect(() => {
    if (!pendiente) return undefined
    const mostrar = setTimeout(() => setVisible(true), RETRASO_MS)
    const rendirse = setTimeout(() => setEsperaDesde(null), LIMITE_MS)
    return () => {
      clearTimeout(mostrar)
      clearTimeout(rendirse)
      setVisible(false)
      soltar(enlace)
    }
  }, [pendiente])

  return (
    <>
      <p role="status" className="sr-only">
        {pendiente && visible ? 'Cargando pantalla…' : ''}
      </p>
      {pendiente && visible && (
        <div aria-hidden="true" className="pointer-events-none fixed inset-x-0 top-0 z-50 h-0.5 overflow-hidden">
          <div className="barra-navegacion h-full w-1/3 bg-sena-oscuro dark:bg-sena-acento" />
        </div>
      )}
    </>
  )
}
