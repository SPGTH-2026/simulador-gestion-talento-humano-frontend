import { useEffect, useRef } from 'react'
import { useAuth } from '../auth/useAuth'
import { menu } from '../config/menu'
import { CLASE_TEXTO_SUAVE } from '../lib/estilos'
import DatosUsuario from './DatosUsuario'
import SidebarItem from './SidebarItem'
import ThemeToggle from './ThemeToggle'
import Boton from './ui/Boton'
import Icono from './ui/Icono'
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

// Un grupo del menú. La etiqueta solo aparece cuando hay dos grupos: así
// quien únicamente tiene opciones personales (o solo de gestión) no ve un
// título sobrante.
function Grupo({ etiqueta, items, onNavegar }) {
  return (
    <div role="group" aria-label={etiqueta || undefined} className="flex flex-col gap-1">
      {etiqueta && (
        <p className={`px-3 pb-1 pt-3 text-sm font-medium ${CLASE_TEXTO_SUAVE}`}>
          {etiqueta}
        </p>
      )}
      {items.map((item) => (
        <SidebarItem key={item.id} item={item} onNavegar={onNavegar} />
      ))}
    </div>
  )
}

// En móvil el menú es un cajón que entra desde la izquierda y se cierra con el
// fondo, con Escape o al elegir una opción; desde 'lg' vuelve a ser una columna
// fija. Marco claro: superficie blanca en claro y azul profundo en oscuro; el
// verde queda como señal pequeña en el ícono del ítem activo.
//
// Abierto, se comporta como un diálogo: recibe el foco y el marco le pone
// 'inert' al resto de la página. 'onCerrar' es para cerrarlo sin elegir nada
// (el marco devuelve entonces el foco al botón que lo abrió); 'onNavegar', para
// cuando se eligió una opción.
export default function Sidebar({ abierto = false, onCerrar, onNavegar }) {
  const { can, logout } = useAuth()
  const cajon = useRef(null)
  const items = filtrarMenu(menu, can)

  // Las vistas personales del aspirante van en su propio grupo, como antes.
  const gestion = items.filter((item) => !item.id.startsWith('mis-'))
  const personal = items.filter((item) => item.id.startsWith('mis-'))
  const conEtiquetas = gestion.length > 0 && personal.length > 0

  useEffect(() => {
    if (!abierto) return undefined
    cajon.current?.focus({ preventScroll: true })
    const alTeclear = (e) => {
      if (e.key === 'Escape') onCerrar?.()
    }
    document.addEventListener('keydown', alTeclear)
    return () => document.removeEventListener('keydown', alTeclear)
  }, [abierto, onCerrar])

  return (
    <>
      <div
        onClick={onCerrar}
        aria-hidden="true"
        className={`fixed inset-0 z-30 bg-sena-noche/60 transition-opacity motion-reduce:transition-none lg:hidden ${
          abierto ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
      />

      {/* Cerrado en móvil, el cajón queda 'invisible': así sus enlaces no
          reciben el foco del teclado ni los lee un lector de pantalla. La
          transición de 'visibility' va solo al cerrar: al abrir debe ser
          inmediata, porque el cajón recibe el foco en ese mismo instante y un
          elemento oculto no puede recibirlo. */}
      <aside
        ref={cajon}
        tabIndex={-1}
        role={abierto ? 'dialog' : undefined}
        aria-modal={abierto || undefined}
        aria-label={abierto ? 'Menú' : undefined}
        className={`fixed inset-y-0 left-0 z-40 flex w-72 max-w-[85vw] shrink-0 flex-col border-r border-sena-linea bg-white text-slate-700 duration-200 focus:outline-none motion-reduce:transition-none dark:border-sena-borde/40 dark:bg-sena-menu-bajo dark:text-sena-texto lg:static lg:z-auto lg:w-60 lg:translate-x-0 ${
          abierto ? 'translate-x-0 transition-[translate]' : '-translate-x-full transition-[translate,visibility] max-lg:invisible'
        }`}
      >
        {/* 50 px: el Manual de Identidad Visual exige un mínimo de 50 px para
            el logosímbolo y no se deforma su geometría. En claro va en verde
            institucional; en oscuro, en su versión negativa (blanca). */}
        <div className="flex h-16 shrink-0 items-center gap-3 border-b border-sena-linea px-4 dark:border-sena-borde/40">
          <LogoSena className="size-[50px] shrink-0 text-sena dark:text-white" />
          <div className="min-w-0">
            <p className="text-base font-bold leading-tight text-sena-azul dark:text-white">SPGTH</p>
            <p className={`text-xs leading-snug ${CLASE_TEXTO_SUAVE}`}>
              Simulador de gestión de talento humano
            </p>
          </div>
          <button
            type="button"
            onClick={onCerrar}
            aria-label="Cerrar menú"
            className="ml-auto grid size-11 shrink-0 place-items-center rounded-lg text-slate-600 transition-colors hover:bg-sena-hundido hover:text-sena-azul motion-reduce:transition-none dark:text-sena-texto-suave dark:hover:bg-white/10 dark:hover:text-white lg:hidden"
          >
            <Icono nombre="cerrar" />
          </button>
        </div>

        {/* Lo único que desplaza es esta zona. min-h-0 es imprescindible: sin él,
            un flex item en columna no baja de su altura mínima y el contenido
            se desborda en vez de generar barra. Así, con todos los permisos
            abiertos, las últimas opciones quedan alcanzables. */}
        <div className="scroll-sena-contenido flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto overflow-x-hidden p-3">
          <nav aria-label="Menú principal" className="flex flex-col gap-1">
            {gestion.length > 0 && (
              <Grupo etiqueta={conEtiquetas ? 'Módulos' : ''} items={gestion} onNavegar={onNavegar} />
            )}
            {personal.length > 0 && (
              <Grupo etiqueta={conEtiquetas ? 'Mi espacio' : ''} items={personal} onNavegar={onNavegar} />
            )}
          </nav>

          {/* Solo móvil: en la barra superior ya no hay sitio para la cuenta.
              Va al final de la zona desplazable (no fija) para que en pantallas
              bajas, como un teléfono horizontal, no le quite espacio al menú. */}
          <div className="mt-auto flex flex-col gap-1 border-t border-sena-linea pt-3 dark:border-sena-borde/40 sm:hidden">
            <div className="px-3 py-2">
              <DatosUsuario />
            </div>
            <ThemeToggle conTexto />
            <Boton variante="fantasma" tamano="tactil" onClick={logout} className="w-full justify-start">
              <Icono nombre="salir" />
              Cerrar sesión
            </Boton>
          </div>
        </div>
      </aside>
    </>
  )
}
