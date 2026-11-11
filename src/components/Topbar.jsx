import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../auth/useAuth'
import { CLASE_BOTON_ICONO, CLASE_TEXTO_SUAVE } from '../lib/estilos'
import { migasDe } from '../lib/migas'
import DatosUsuario from './DatosUsuario'
import ThemeToggle from './ThemeToggle'
import Icono from './ui/Icono'

// Ruta de navegación: dónde está el usuario dentro del menú. En móvil caben
// dos líneas: el tramo anterior, pequeño y con enlace si lo tiene, sobre la
// página actual. Desde 'sm' se ve la ruta completa en una sola línea.
function Migas() {
  const { pathname } = useLocation()
  const tramos = migasDe(pathname)
  // Con un solo tramo la ruta repetiría el título de la página; solo se muestra
  // cuando orienta (módulo / pantalla) o ofrece volver (detalle, edición).
  if (tramos.length <= 1) return <div className="min-w-0 flex-1" />

  return (
    <nav aria-label="Ruta de navegación" className="min-w-0 flex-1">
      <ol className="flex min-w-0 flex-col justify-center sm:flex-row sm:items-center sm:justify-start sm:gap-2 sm:text-sm">
        {tramos.map((tramo, i) => {
          const ultimo = i === tramos.length - 1
          const visibleEnMovil = i >= tramos.length - 2
          return (
            <li
              key={tramo.texto}
              className={`min-w-0 items-center gap-2 ${visibleEnMovil ? 'flex' : 'hidden sm:flex'}`}
            >
              {i > 0 && (
                <span className="hidden text-slate-500 dark:text-sena-texto-suave sm:inline" aria-hidden="true">
                  /
                </span>
              )}
              {tramo.to ? (
                <Link
                  to={tramo.to}
                  className={`inline-flex min-h-6 items-center truncate text-xs hover:underline sm:text-sm ${CLASE_TEXTO_SUAVE}`}
                >
                  {tramo.texto}
                </Link>
              ) : (
                <span
                  aria-current={ultimo ? 'page' : undefined}
                  className={`truncate ${
                    ultimo
                      ? 'text-base font-semibold leading-snug text-sena-azul dark:text-white sm:text-sm'
                      : `text-xs sm:text-sm ${CLASE_TEXTO_SUAVE}`
                  }`}
                >
                  {tramo.texto}
                </span>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}

// Barra superior neutra: sobre el mismo lienzo del contenido, sin banda de
// color. En móvil lleva el menú, la ruta y las notificaciones; el tema, la
// cuenta y el cierre de sesión pasan al pie del cajón. Desde 'sm' vuelven a la
// barra: tema, notificaciones, usuario con su rol y ficha, y cerrar sesión.
export default function Topbar({ onAbrirMenu }) {
  const { logout, can } = useAuth()

  return (
    <header className="flex h-16 shrink-0 items-center gap-2 border-b border-sena-linea bg-sena-lienzo px-3 dark:border-sena-borde/40 dark:bg-sena-noche sm:px-6 lg:px-8">
      {/* Solo en móvil/tablet: abre el cajón de navegación. */}
      <button
        type="button"
        onClick={onAbrirMenu}
        aria-label="Abrir menú"
        className="-ml-1 grid size-11 shrink-0 place-items-center rounded-lg text-slate-700 transition-colors hover:bg-sena-hundido hover:text-sena-azul motion-reduce:transition-none dark:text-sena-texto dark:hover:bg-white/10 lg:hidden"
      >
        <Icono nombre="menu" className="size-6" />
      </button>

      <Migas />

      <div className="ml-auto flex shrink-0 items-center gap-1 sm:gap-2">
        <div className="hidden sm:block">
          <ThemeToggle />
        </div>

        {can('propio:notificaciones') && (
          <Link to="/notificaciones" className={CLASE_BOTON_ICONO} aria-label="Notificaciones">
            <Icono nombre="campana" />
          </Link>
        )}

        <div className="hidden items-center gap-2 sm:flex">
          <span className="mx-1 h-6 w-px bg-sena-linea dark:bg-sena-borde/60" aria-hidden="true" />
          <DatosUsuario />
          <button
            type="button"
            onClick={logout}
            aria-label="Cerrar sesión"
            className="ml-1 inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-3 text-sm font-semibold text-slate-700 transition-colors hover:bg-sena-hundido hover:text-sena-azul motion-reduce:transition-none dark:text-sena-texto dark:hover:bg-white/10 dark:hover:text-white lg:min-h-10"
          >
            <Icono nombre="salir" />
            <span className="hidden lg:inline">Cerrar sesión</span>
          </button>
        </div>
      </div>
    </header>
  )
}
