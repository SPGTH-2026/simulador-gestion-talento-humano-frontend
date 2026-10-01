import { useAuth } from '../auth/useAuth'
import { menu } from '../config/menu'
import SidebarItem from './SidebarItem'
import LogoSena from './ui/LogoSena'

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

export default function Sidebar() {
  const { can } = useAuth()
  const items = filtrarMenu(menu, can)

  return (
    <aside className="flex w-64 shrink-0 flex-col gap-4 bg-slate-800 p-4 text-white dark:bg-sena-noche">
      {/* Versión negativa (blanco) del logosímbolo: el manual la autoriza
          sobre fondos oscuros para garantizar el contraste. */}
      <div className="flex shrink-0 items-center gap-3">
        {/* 52 px: el Manual de Identidad Visual exige un minimo de 50 px
            y no se deforma la geometria original del logosimbolo. */}
        <LogoSena className="size-[52px]" />
        <p className="text-lg font-bold">SPGTH</p>
      </div>

      {/* El nav es lo unico que desplaza. min-h-0 es imprescindible: sin el,
          un flex item en columna no baja de su altura minima y el contenido
          se desborda en vez de generar barra. Asi, con todos los permisos
          abiertos, las ultimas opciones quedan alcanzables. */}
      <nav className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto overflow-x-hidden pr-1">
        {items.map((item) => (
          <SidebarItem key={item.id} item={item} />
        ))}
      </nav>
    </aside>
  )
}
