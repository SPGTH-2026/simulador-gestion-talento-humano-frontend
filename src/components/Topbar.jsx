import { Link } from 'react-router-dom'
import { useAuth } from '../auth/useAuth'
import ThemeToggle from './ThemeToggle'

// Convierte la clave del rol en un texto legible.
// Ej: 'revisor_documental' -> 'Revisor documental'
function etiqueta(clave) {
  if (!clave) return ''
  const texto = clave.replace(/_/g, ' ')
  return texto.charAt(0).toUpperCase() + texto.slice(1)
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
      className="h-6 w-6"
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

export default function Topbar() {
  const { user, logout, can } = useAuth()

  return (
    <header className="flex h-16 items-center justify-end gap-4 border-b border-slate-200 bg-white px-6 dark:border-sena-borde dark:bg-sena-noche">
      <ThemeToggle />

      {can('propio:notificaciones') && (
        <Link
          to="/notificaciones"
          className="rounded-full p-2 text-slate-600 hover:bg-slate-100 dark:text-sena-texto-suave dark:hover:bg-sena-superficie-alta dark:hover:text-sena-texto"
          aria-label="Notificaciones"
        >
          <IconoCampana />
        </Link>
      )}

      <div className="text-right leading-tight">
        <p className="text-sm font-medium text-slate-800 dark:text-sena-texto">
          {user?.name}
        </p>
        <p className="text-xs text-slate-500 dark:text-sena-texto-suave">
          {etiqueta(user?.role)}
          {user?.subrole ? ` · ${etiqueta(user.subrole)}` : ''}
        </p>
      </div>

      <button
        type="button"
        onClick={logout}
        className="flex items-center gap-2 rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 dark:border-sena-borde dark:text-sena-texto dark:hover:bg-sena-superficie-alta"
      >
        <IconoSalir />
        Cerrar sesión
      </button>
    </header>
  )
}
