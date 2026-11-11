import { useId, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import Icono from './ui/Icono'

// Ítem activo: tinte azul suave, texto azul institucional y el ícono en verde.
// El verde ya no rellena el ítem: queda como señal pequeña y el texto conserva
// un contraste alto (azul sobre el tinte: 11.5:1).
const CLASE_BASE =
  'group flex min-h-11 items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors motion-reduce:transition-none lg:min-h-10'
const CLASE_ACTIVO = 'bg-sena-hundido font-semibold text-sena-azul dark:bg-white/10 dark:text-white'
const CLASE_REPOSO =
  'text-slate-600 hover:bg-sena-fondo hover:text-sena-azul dark:text-sena-texto-suave dark:hover:bg-white/5 dark:hover:text-white'

const claseIcono = (activo) =>
  `size-5 shrink-0 transition-colors motion-reduce:transition-none ${
    activo
      ? 'text-sena-oscuro dark:text-sena-acento'
      : 'text-slate-500 group-hover:text-sena-azul dark:text-sena-texto-suave dark:group-hover:text-white'
  }`

// onNavegar es opcional: en móvil el menú es un cajón y necesita cerrarse
// cuando se elige una opción. Conserva la navegación normal del NavLink.
export default function SidebarItem({ item, onNavegar }) {
  const { pathname } = useLocation()
  const idPanel = useId()
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
      <NavLink
        to={destino}
        end={destino === '/'}
        onClick={onNavegar}
        className={({ isActive }) => `${CLASE_BASE} ${isActive ? CLASE_ACTIVO : CLASE_REPOSO}`}
      >
        {({ isActive }) => (
          <>
            <Icono nombre={item.icono} className={claseIcono(isActive)} />
            <span className="min-w-0 truncate">{item.label}</span>
          </>
        )}
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
        aria-controls={idPanel}
        className={`${CLASE_BASE} w-full ${
          hijoActivo ? 'font-semibold text-sena-azul dark:text-white' : CLASE_REPOSO
        }`}
      >
        <Icono nombre={item.icono} className={claseIcono(hijoActivo)} />
        <span className="min-w-0 flex-1 truncate text-left">{item.label}</span>
        <Icono
          nombre="chevron"
          className={`size-4 shrink-0 text-slate-500 transition-transform duration-200 motion-reduce:transition-none dark:text-sena-texto-suave ${
            abierto ? 'rotate-180' : ''
          }`}
        />
      </button>

      {abierto && (
        <div
          id={idPanel}
          className="ml-[1.375rem] mt-1 flex flex-col gap-1 border-l border-sena-linea pl-3 dark:border-white/10"
        >
          {item.children.map((hijo) => (
            <NavLink
              key={hijo.to}
              to={hijo.to}
              end
              onClick={onNavegar}
              className={({ isActive }) =>
                `flex min-h-11 items-center rounded-lg px-3 py-2 text-sm transition-colors motion-reduce:transition-none lg:min-h-10 ${
                  isActive ? CLASE_ACTIVO : CLASE_REPOSO
                }`
              }
            >
              {hijo.label}
            </NavLink>
          ))}
        </div>
      )}
    </div>
  )
}
