import { useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'

// El ítem activo se pinta con el verde institucional y texto azul oscuro: el
// verde puro no alcanza 4.5:1 con blanco, pero sí con el azul de la marca.
const claseLink = ({ isActive }) =>
  `block rounded-lg px-3 py-2 text-sm transition-colors ${
    isActive
      ? 'bg-sena font-semibold text-sena-menu-bajo shadow-sm'
      : 'text-slate-200 hover:bg-white/10 hover:text-white'
  }`

function IconoChevron({ abierto }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`h-4 w-4 shrink-0 transition-transform duration-200 ${
        abierto ? 'rotate-180' : ''
      }`}
      aria-hidden="true"
    >
      <path d="m19.5 8.25-7.5 7.5-7.5-7.5" />
    </svg>
  )
}

// onNavegar es opcional: en móvil el menú es un cajón y necesita cerrarse
// cuando se elige una opción. Conserva la navegación normal del NavLink.
export default function SidebarItem({ item, onNavegar }) {
  const { pathname } = useLocation()
  const hijos = item.children ?? []
  // Un módulo con un solo hijo visible no necesita acordeón: se muestra como
  // enlace directo (por ejemplo, el aspirante solo tiene 'Listado'). La opción
  // `acordeon: true` del menú fuerza el acordeón aunque haya un solo hijo.
  const tieneHijos = hijos.length > 1 || item.acordeon === true
  const hijoActivo = tieneHijos && hijos.some((hijo) => hijo.to === pathname)
  const [abierto, setAbierto] = useState(hijoActivo)

  // Opción simple: un link directo
  if (!tieneHijos) {
    const destino = hijos.length === 1 ? hijos[0].to : item.to
    return (
      <NavLink to={destino} end={destino === '/'} className={claseLink} onClick={onNavegar}>
        {item.label}
      </NavLink>
    )
  }

  // Módulo con hijos: acordeón
  return (
    <div>
      <button
        type="button"
        onClick={() => setAbierto(!abierto)}
        aria-expanded={abierto}
        className={`flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${
          hijoActivo
            ? 'font-semibold text-white'
            : 'text-slate-200 hover:bg-white/10 hover:text-white'
        }`}
      >
        <span className="min-w-0 truncate">{item.label}</span>
        <IconoChevron abierto={abierto} />
      </button>

      {abierto && (
        <div className="ml-3 mt-1 flex flex-col gap-1 border-l border-white/15 pl-3">
          {item.children.map((hijo) => (
            <NavLink key={hijo.to} to={hijo.to} end className={claseLink} onClick={onNavegar}>
              {hijo.label}
            </NavLink>
          ))}
        </div>
      )}
    </div>
  )
}
