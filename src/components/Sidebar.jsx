import { Fragment } from 'react'
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
// La superficie es plana (sin degradado): el azul institucional es el ancla y
// el verde queda reservado para el ítem activo.
export default function Sidebar({ abierto = false, onCerrar }) {
  const { can } = useAuth()
  const items = filtrarMenu(menu, can)

  return (
    <>
      <div
        onClick={onCerrar}
        aria-hidden="true"
        className={`fixed inset-0 z-30 bg-sena-noche/60 backdrop-blur-[2px] transition-opacity lg:hidden ${
          abierto ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
      />

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-60 max-w-[85vw] shrink-0 flex-col border-r border-sena-menu-bajo/60 bg-sena-menu text-white transition-transform duration-200 dark:border-sena-borde/60 dark:bg-sena-menu-bajo lg:static lg:z-auto lg:translate-x-0 ${
          abierto ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Versión negativa (blanco) del logosímbolo: el manual la autoriza
            sobre fondos oscuros para garantizar el contraste. */}
        <div className="flex min-h-16 shrink-0 items-center gap-3 border-b border-white/10 px-4 py-3">
          {/* 52 px: el Manual de Identidad Visual exige un mínimo de 50 px
              y no se deforma la geometría original del logosímbolo. */}
          <LogoSena className="size-[52px] shrink-0 text-white" />
          <div className="min-w-0">
            <p className="text-base font-bold leading-tight">SPGTH</p>
            <p className="text-xs leading-snug text-slate-300">
              Simulador de gestión de talento humano
            </p>
          </div>
          <button
            type="button"
            onClick={onCerrar}
            aria-label="Cerrar menú"
            className="ml-auto rounded-lg p-2 text-slate-200 transition-colors hover:bg-white/10 hover:text-white lg:hidden"
          >
            <IconoCerrar />
          </button>
        </div>

        {/* El nav es lo único que desplaza. min-h-0 es imprescindible: sin él,
            un flex item en columna no baja de su altura mínima y el contenido
            se desborda en vez de generar barra. Así, con todos los permisos
            abiertos, las últimas opciones quedan alcanzables. */}
        <nav
          aria-label="Menú principal"
          className="scroll-sena-lateral flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto overflow-x-hidden p-3"
        >
          {items.map((item, indice) => (
            <Fragment key={item.id}>
              {/* Separa el espacio de gestión del espacio personal. Solo
                  aparece si el usuario tiene opciones de ambos lados. */}
              {item.to === '/mis-postulaciones' && indice > 0 && (
                <div className="my-2 border-t border-white/10" aria-hidden="true" />
              )}
              <SidebarItem item={item} onNavegar={onCerrar} />
            </Fragment>
          ))}
        </nav>
      </aside>
    </>
  )
}
