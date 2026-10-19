import { useAuth } from '../auth/useAuth'
import { menu } from '../config/menu'
import SidebarItem from './SidebarItem'
import LogoSena from './ui/LogoSena'

function IconoCerrar() {
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
      <path d="M6 18 18 6M6 6l12 12" />
    </svg>
  )
}

// Deja solo lo que el usuario puede ver, incluyendo los hijos
function filtrarMenu(items, can) {
  return items
    .map((item) => {
      if (item.children) {
        const hijos = item.children.filter((hijo) => can(hijo.permiso))
        return hijos.length > 0 ? { ...item, children: hijos } : null
      }
      return can(item.permiso) ? item : null
    })
    .filter(Boolean)
}

// En móvil el menú es un cajón que entra desde la izquierda y se cierra con el
// fondo oscuro o al elegir una opción; desde 'lg' vuelve a ser una columna fija.
export default function Sidebar({ abierto = false, onCerrar }) {
  const { can } = useAuth()
  const items = filtrarMenu(menu, can)

  return (
    <>
      <div
        onClick={onCerrar}
        aria-hidden="true"
        className={`fixed inset-0 z-30 bg-slate-900/50 transition-opacity lg:hidden ${
          abierto ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
      />

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-52 shrink-0 flex-col gap-3 border-r border-white/10 bg-gradient-to-b from-sena-menu to-sena-menu-bajo p-3 text-white transition-transform duration-200 dark:border-sena-borde dark:from-sena-superficie dark:to-sena-noche lg:static lg:z-auto lg:translate-x-0 ${
          abierto ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Versión negativa (blanco) del logosímbolo: el manual la autoriza
            sobre fondos oscuros para garantizar el contraste. */}
        <div className="flex shrink-0 items-center gap-3">
          {/* 52 px: el Manual de Identidad Visual exige un minimo de 50 px
              y no se deforma la geometria original del logosimbolo. */}
          <LogoSena className="size-[52px]" />
          <p className="text-base font-bold">SPGTH</p>
          <button
            type="button"
            onClick={onCerrar}
            aria-label="Cerrar menú"
            className="ml-auto rounded-md p-1 text-slate-200 transition-colors hover:bg-white/10 hover:text-white lg:hidden"
          >
            <IconoCerrar />
          </button>
        </div>

        {/* El nav es lo unico que desplaza. min-h-0 es imprescindible: sin el,
            un flex item en columna no baja de su altura minima y el contenido
            se desborda en vez de generar barra. Asi, con todos los permisos
            abiertos, las ultimas opciones quedan alcanzables. */}
        <nav className="scroll-sena-lateral flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto overflow-x-hidden pr-1">
          {items.map((item) => (
            <SidebarItem key={item.id} item={item} onNavegar={onCerrar} />
          ))}
        </nav>
      </aside>
    </>
  )
}
