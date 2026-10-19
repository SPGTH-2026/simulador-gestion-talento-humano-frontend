import { useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'

const claseLink = ({ isActive }) =>
  `block rounded-md px-2.5 py-1.5 text-[13px] transition-colors ${
    isActive
      ? 'bg-exito font-semibold text-white dark:text-sena-noche'
      : 'text-slate-200 hover:bg-white/10 hover:text-white'
  }`

// onNavegar es opcional: en móvil el menú es un cajón y necesita cerrarse
// cuando se elige una opción. Conserva la navegación normal del NavLink.
export default function SidebarItem({ item, onNavegar }) {
  const { pathname } = useLocation()
  const tieneHijos = Boolean(item.children)
  const hijoActivo = tieneHijos && item.children.some((hijo) => hijo.to === pathname)
  const [abierto, setAbierto] = useState(hijoActivo)

  // Opción simple: un link directo
  if (!tieneHijos) {
    return (
      <NavLink to={item.to} end={item.to === '/'} className={claseLink} onClick={onNavegar}>
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
        className="flex w-full items-center justify-between rounded-md px-2.5 py-1.5 text-[13px] text-slate-200 transition-colors hover:bg-white/10 hover:text-white"
      >
        {item.label}
        <span aria-hidden="true">{abierto ? '▾' : '▸'}</span>
      </button>

      {abierto && (
        <div className="ml-3 mt-0.5 flex flex-col gap-0.5 border-l border-white/20 pl-2">
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
