import { useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'

const claseLink = ({ isActive }) =>
  `block rounded px-3 py-2 text-sm ${
    isActive
      ? 'bg-sena text-white'
      : 'text-slate-200 hover:bg-slate-700 hover:text-white'
  }`

export default function SidebarItem({ item }) {
  const { pathname } = useLocation()
  const tieneHijos = Boolean(item.children)
  const hijoActivo = tieneHijos && item.children.some((hijo) => hijo.to === pathname)
  const [abierto, setAbierto] = useState(hijoActivo)

  // Opción simple: un link directo
  if (!tieneHijos) {
    return (
      <NavLink to={item.to} end={item.to === '/'} className={claseLink}>
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
        className="flex w-full items-center justify-between rounded px-3 py-2 text-sm text-slate-200 hover:bg-slate-700"
      >
        {item.label}
        <span aria-hidden="true">{abierto ? '▾' : '▸'}</span>
      </button>

      {abierto && (
        <div className="ml-3 mt-1 flex flex-col gap-1 border-l border-slate-600 pl-2">
          {item.children.map((hijo) => (
            <NavLink key={hijo.to} to={hijo.to} end className={claseLink}>
              {hijo.label}
            </NavLink>
          ))}
        </div>
      )}
    </div>
  )
}
