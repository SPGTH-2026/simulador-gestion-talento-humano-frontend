import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import ThemeToggle from '../components/ThemeToggle'
import Boton from '../components/ui/Boton'
import Icono from '../components/ui/Icono'
import MarcaSpgth from '../components/informativo/MarcaSpgth'
import { useAuth } from '../auth/useAuth'
import { PAGINAS_INFORMATIVAS } from '../config/paginasInformativas'
import { CLASE_TEXTO_SUAVE } from '../lib/estilos'
import { EnlaceContacto } from '../pages/informativas/contactoProyecto'

// Marco de las páginas informativas: públicas (se leen con o sin sesión). Cabecera institucional con la marca completa de SPGTH (la
// misma del menú de la aplicación), navegación entre las páginas y el acceso; pie común con la declaración del proyecto, el contacto y los
// enlaces a las páginas. Hay UN solo desplazamiento (el de la página): la cabecera queda
// fija arriba, el contenido tiene su altura natural y el pie aparece al llegar al final. No usa el marco de acceso (dos paneles) porque son textos largos.
const CLASE_NAV =
  'inline-flex min-h-11 items-center rounded-lg px-3 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sena/60 motion-reduce:transition-none'
const claseNavLink = ({ isActive }) =>
  `${CLASE_NAV} ${
    isActive
      ? 'bg-sena-hundido font-semibold text-sena-azul dark:bg-white/10 dark:text-white'
      : 'text-slate-600 hover:bg-sena-fondo hover:text-sena-azul dark:text-sena-texto-suave dark:hover:bg-white/5 dark:hover:text-white'
  }`

export default function LayoutInformativo() {
  const { user } = useAuth()
  const inicio = user ? '/' : '/login'
  const navegar = useNavigate()
  const { key } = useLocation()
  // 'default' es la primera entrada del historial: no hay a dónde volver y se va al acceso o al inicio.
  const volver = () => (key !== 'default' ? navegar(-1) : navegar(inicio))

  return (
    <div className="flex min-h-dvh flex-col bg-sena-lienzo dark:bg-sena-noche">
      <a
        href="#contenido-informativo"
        className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50 focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-sena-azul focus:shadow-md dark:focus:bg-sena-superficie dark:focus:text-white"
      >
        Saltar al contenido
      </a>

      <header className="sticky top-0 z-30 border-b border-sena-linea bg-white dark:border-sena-borde/40 dark:bg-sena-menu-bajo">
        <div className="mx-auto flex h-16 w-full max-w-5xl items-center gap-3 px-4 sm:px-6">
          <MarcaSpgth to={inicio} />
          <nav aria-label="Páginas informativas" className="ml-4 hidden items-center gap-1 lg:flex">
            {PAGINAS_INFORMATIVAS.map((p) => (
              <NavLink key={p.ruta} to={p.ruta} className={claseNavLink}>
                {p.corto ?? p.titulo}
              </NavLink>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-1 sm:gap-2">
            <ThemeToggle />
            <Boton as={Link} to={inicio} variante="contorno">
              {user ? 'Ir al inicio' : 'Iniciar sesión'}
            </Boton>
          </div>
        </div>
      </header>

      <main
        id="contenido-informativo"
        tabIndex={-1}
        className="flex-1 scroll-mt-20 focus:outline-none"
      >
        <div className="mx-auto flex w-full max-w-5xl flex-col px-4 py-6 sm:px-6 sm:py-8">
        <Boton variante="fantasma" onClick={volver} className="-ml-3 mb-2 self-start">
          <Icono nombre="flechaIzquierda" className="size-5 shrink-0" />
          Volver
        </Boton>
        <Outlet />
        </div>
      </main>

      <footer className="border-t border-sena-linea bg-white dark:border-sena-borde/40 dark:bg-sena-menu-bajo">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-2 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:gap-6">
          <p className={`text-sm leading-relaxed ${CLASE_TEXTO_SUAVE}`}>
            SPGTH es un proyecto académico de simulación: participar no equivale a una contratación real. Contacto: <EnlaceContacto />
          </p>
          <nav aria-label="Información" className="-mx-3 flex shrink-0 flex-wrap gap-x-1 gap-y-0.5 lg:mx-0">
            {PAGINAS_INFORMATIVAS.map((p) => (
              <NavLink key={p.ruta} to={p.ruta} className={claseNavLink}>
                {p.corto ?? p.titulo}
              </NavLink>
            ))}
          </nav>
        </div>
      </footer>
    </div>
  )
}
