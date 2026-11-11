import { Suspense, useEffect, useRef, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import Topbar from '../components/Topbar'
import PantallaCarga from '../components/ui/PantallaCarga'

// Marco de la aplicación: menú a la izquierda, barra neutra arriba y el
// contenido sobre un lienzo claro (azul profundo en oscuro).
export default function AppLayout() {
  const { pathname } = useLocation()
  // Estado del cajón de navegación en móvil. En 'lg' el menú es una columna
  // fija y este estado no tiene efecto.
  const [menuAbierto, setMenuAbierto] = useState(false)
  const botonQueAbrio = useRef(null)
  const focoAlCerrar = useRef(null)

  // Al cerrar el cajón el foco va a otro sitio: al botón que lo abrió si se
  // cerró sin elegir nada (Escape, fondo, botón) o al contenido si se navegó.
  // Hay que esperar al render: mientras estaba abierto, el resto de la página
  // era 'inert' y no admitía el foco.
  useEffect(() => {
    if (!menuAbierto && focoAlCerrar.current) {
      focoAlCerrar.current()
      focoAlCerrar.current = null
    }
  }, [menuAbierto])

  // En 'lg' el menú es una columna fija: un cajón que quedara abierto dejaría
  // 'inert' el resto de la página.
  useEffect(() => {
    const escritorio = window.matchMedia('(min-width: 1024px)')
    const alCambiar = (e) => {
      if (!e.matches) return
      // El cajón deja de existir: el foco pasa al contenido, visible y que
      // admite teclado, en lugar de quedarse en un contenedor sin anillo.
      focoAlCerrar.current = () => document.getElementById('contenido')?.focus()
      setMenuAbierto(false)
    }
    escritorio.addEventListener('change', alCambiar)
    return () => escritorio.removeEventListener('change', alCambiar)
  }, [])

  const abrirMenu = (e) => {
    botonQueAbrio.current = e.currentTarget
    setMenuAbierto(true)
  }
  const cerrarMenu = () => {
    focoAlCerrar.current = () => botonQueAbrio.current?.focus()
    setMenuAbierto(false)
  }
  const cerrarAlNavegar = () => {
    focoAlCerrar.current = () => document.getElementById('contenido')?.focus()
    setMenuAbierto(false)
  }

  return (
    <div className="flex h-screen overflow-hidden bg-sena-lienzo dark:bg-sena-noche">
      {/* Enlace para saltar el menú: solo se ve al enfocarlo con el teclado. */}
      <a
        href="#contenido"
        inert={menuAbierto}
        className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50 focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-sena-azul focus:shadow-md dark:focus:bg-sena-superficie dark:focus:text-white"
      >
        Saltar al contenido
      </a>

      <Sidebar abierto={menuAbierto} onCerrar={cerrarMenu} onNavegar={cerrarAlNavegar} />

      <div className="flex min-w-0 flex-1 flex-col" inert={menuAbierto}>
        <Topbar onAbrirMenu={abrirMenu} />

        <main
          id="contenido"
          tabIndex={-1}
          className="scroll-sena-contenido flex-1 overflow-y-auto px-4 py-5 focus:outline-none sm:px-6 lg:px-8 lg:py-7"
        >
          <div className="mx-auto w-full max-w-[1440px]">
            {/* El Suspense vive AQUÍ y no solo en el router: mientras llega el
                código de una pantalla el marco (menú y barra) sigue en su sitio
                y solo el contenido muestra la espera. */}
            <Suspense fallback={<PantallaCarga operacion="pantalla" id={pathname} />}>
              <Outlet />
            </Suspense>
          </div>
        </main>
      </div>
    </div>
  )
}
