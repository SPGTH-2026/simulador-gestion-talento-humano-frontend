import { useAuth } from '../auth/useAuth'
import { menu } from '../config/menu'
import SidebarItem from './SidebarItem'

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
    <aside className="flex w-64 shrink-0 flex-col gap-4 bg-slate-800 p-4 text-white">
      <p className="text-lg font-bold">SPGTH</p>
      <nav className="flex flex-col gap-1">
        {items.map((item) => (
          <SidebarItem key={item.id} item={item} />
        ))}
      </nav>
    </aside>
  )
}
