import { Link } from 'react-router-dom'
import { useAuth } from '../auth/useAuth'
import ThemeToggle from './ThemeToggle'
import Boton from './ui/Boton'

// Convierte la clave del rol en un texto legible.
// Ej: 'revisor_documental' -> 'Revisor documental'
function etiqueta(clave) {
  if (!clave) return ''
  const texto = clave.replace(/_/g, ' ')
  return texto.charAt(0).toUpperCase() + texto.slice(1)
}

// Dos iniciales para el avatar: la primera letra del nombre y del apellido.
function iniciales(nombre) {
  if (!nombre) return '?'
  return nombre
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((parte) => parte.charAt(0))
    .join('')
    .toUpperCase()
}

function IconoMenu() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-6 w-6"
      aria-hidden="true"
    >
      <path d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
    </svg>
  )
}

function IconoCampana() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <path d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
    </svg>
  )
}

function IconoSalir() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <path d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9" />
    </svg>
  )
}

// La topbar comparte el azul del menú lateral: juntos forman el marco oscuro
// de la aplicación y dejan el blanco/gris para el contenido. El texto y los
// controles van en claro en ambos temas.
export default function Topbar({ onAbrirMenu }) {
  const { user, logout, can } = useAuth()

  return (
    <header className="flex h-16 shrink-0 items-center gap-2 border-b border-sena-menu-bajo/60 bg-sena-menu px-3 text-white dark:border-sena-borde/60 dark:bg-sena-menu-bajo sm:px-5">
      {/* Solo en móvil/tablet: abre el cajón de navegación. */}
      <button
        type="button"
        onClick={onAbrirMenu}
        aria-label="Abrir menú"
        className="rounded-lg p-2 text-slate-100 transition-colors hover:bg-white/10 hover:text-white lg:hidden"
      >
        <IconoMenu />
      </button>

      <div className="ml-auto flex min-w-0 items-center gap-1 sm:gap-2">
        <ThemeToggle />

        {can('propio:notificaciones') && (
          <Link
            to="/notificaciones"
            className="rounded-full p-2 text-slate-200 transition-colors hover:bg-white/10 hover:text-white"
            aria-label="Notificaciones"
          >
            <IconoCampana />
          </Link>
        )}

        <span className="mx-1 hidden h-6 w-px bg-white/15 sm:block" aria-hidden="true" />

        <div className="flex min-w-0 items-center gap-2.5">
          <span
            role="img"
            aria-label={user?.name ?? 'Usuario'}
            className="grid size-9 shrink-0 place-items-center rounded-full bg-white/10 text-sm font-semibold text-white ring-1 ring-white/20"
          >
            {iniciales(user?.name)}
          </span>
          <div className="hidden min-w-0 text-left leading-tight sm:block">
            <p className="truncate text-sm font-semibold text-white">{user?.name}</p>
            <p className="truncate text-xs text-slate-300">
              {etiqueta(user?.role)}
              {user?.subrole ? ` · ${etiqueta(user.subrole)}` : ''}
            </p>
          </div>
        </div>

        <Boton
          variante="sobreOscuro"
          tamano="sm"
          onClick={logout}
          aria-label="Cerrar sesión"
          className="ml-1"
        >
          <IconoSalir />
          <span className="hidden lg:inline">Cerrar sesión</span>
        </Boton>
      </div>
    </header>
  )
}
