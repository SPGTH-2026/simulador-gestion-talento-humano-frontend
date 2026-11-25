import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import ThemeToggle from '../components/ThemeToggle'
import Boton from '../components/ui/Boton'
import { useAuth } from '../auth/useAuth'
import { PAGINAS_INFORMATIVAS } from '../config/paginasInformativas'
import { CLASE_TEXTO_SUAVE } from '../lib/estilos'

// Marco de las páginas informativas: públicas (se leen con o sin sesión), con cabecera mínima, acceso para volver o iniciar sesión,
// aviso de que son borradores de revisión y el resto de páginas al pie. No usa el marco de acceso (dos paneles) porque son textos
// largos. Deliberadamente sin el logosímbolo del SENA: su uso en estas páginas está por decidir.
export default function LayoutInformativo() {
  const navegar = useNavigate()
  const { key } = useLocation()
  const { user } = useAuth()
  // 'default' es la primera entrada del historial: no hay a dónde volver y se va al acceso o al inicio.
  const puedeVolver = key !== 'default'
  const volver = () => (puedeVolver ? navegar(-1) : navegar(user ? '/' : '/login'))

  return (
    <div className="flex min-h-dvh flex-col bg-sena-lienzo dark:bg-sena-noche">
      <a
        href="#contenido-informativo"
        className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50 focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-sena-azul focus:shadow-md dark:focus:bg-sena-superficie dark:focus:text-white"
      >
        Saltar al contenido
      </a>

      <header className="border-b border-sena-linea bg-white dark:border-sena-borde/40 dark:bg-sena-menu-bajo">
        <div className="mx-auto flex w-full max-w-5xl flex-wrap items-center gap-x-3 gap-y-2 px-4 py-3 sm:px-6">
          <Link to={user ? '/' : '/login'} className="min-w-0 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sena">
            <span className="block text-base font-bold leading-tight text-sena-azul dark:text-white">SPGTH</span>
            <span className={`block text-xs leading-snug ${CLASE_TEXTO_SUAVE}`}>Simulador de Procesos de Gestión de Talento Humano</span>
          </Link>
          <div className="ml-auto flex flex-wrap items-center gap-2">
            <Boton variante="fantasma" onClick={volver}>
              Volver
            </Boton>
            <Boton as={Link} to={user ? '/' : '/login'} variante="contorno">
              {user ? 'Ir al inicio' : 'Iniciar sesión'}
            </Boton>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <p
        role="note"
        className="border-b border-aviso/40 bg-aviso/10 px-4 py-2 text-center text-sm font-medium text-aviso sm:px-6"
      >
        Vista de revisión local: borrador sin aprobar. Estas páginas no están publicadas.
      </p>

      <main id="contenido-informativo" tabIndex={-1} className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 focus:outline-none sm:px-6 sm:py-8">
        <Outlet />
      </main>

      <footer className="border-t border-sena-linea bg-white dark:border-sena-borde/40 dark:bg-sena-menu-bajo">
        <nav aria-label="Información" className="mx-auto flex w-full max-w-5xl flex-wrap gap-x-5 gap-y-1 px-4 py-3 text-sm sm:px-6">
          {PAGINAS_INFORMATIVAS.map((p) => (
            <NavLink
              key={p.ruta}
              to={p.ruta}
              className={({ isActive }) =>
                `inline-flex min-h-8 items-center underline-offset-4 hover:underline ${
                  isActive ? 'font-semibold text-sena-azul dark:text-white' : 'text-sena-oscuro dark:text-sena-acento'
                }`
              }
            >
              {p.titulo}
            </NavLink>
          ))}
        </nav>
      </footer>
    </div>
  )
}
