import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import Topbar from '../components/Topbar'

export default function AppLayout() {
  // Estado del cajón de navegación en móvil. En 'lg' el menú es una columna
  // fija y este estado no tiene efecto.
  const [menuAbierto, setMenuAbierto] = useState(false)

  return (
    <div className="flex h-screen overflow-hidden bg-sena-fondo dark:bg-sena-noche">
      <Sidebar abierto={menuAbierto} onCerrar={() => setMenuAbierto(false)} />

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar onAbrirMenu={() => setMenuAbierto(true)} />

        <main className="scroll-sena-contenido flex-1 overflow-y-auto p-4 lg:p-6">
          <div className="mx-auto w-full max-w-[1440px]">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
