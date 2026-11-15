import { useId, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { destinoDeMenu } from '../lib/menuActivo'
import Icono from './ui/Icono'

// Ítem activo: tinte azul suave, texto azul institucional y el ícono en verde.
// El verde ya no rellena el ítem: queda como señal pequeña y el texto conserva
// un contraste alto (azul sobre el tinte: 11.5:1).
// Al presionar, una escala breve confirma el clic (se anula con movimiento
// reducido). Mientras se carga la pantalla de destino, el enlace pulsado queda
// marcado con data-navegando (ver components/IndicadorNavegacion.jsx).
const CLASE_BASE =
  'group flex min-h-11 items-center gap-3 rounded-lg px-3 py-2 text-sm transition-[color,background-color,scale] duration-150 active:scale-[0.98] motion-reduce:transition-none motion-reduce:active:scale-100 lg:min-h-10'
const CLASE_ACTIVO = 'bg-sena-hundido font-semibold text-sena-azul dark:bg-white/10 dark:text-white'
const CLASE_REPOSO =
  'text-slate-600 hover:bg-sena-fondo hover:text-sena-azul dark:text-sena-texto-suave dark:hover:bg-white/5 dark:hover:text-white'

const claseIcono = (activo) =>
  `size-5 shrink-0 transition-colors motion-reduce:transition-none ${
    activo
      ? 'text-sena-oscuro dark:text-sena-acento'
      : 'text-slate-500 group-hover:text-sena-azul dark:text-sena-texto-suave dark:group-hover:text-white'
  }`

// 'page' si estamos exactamente en el destino; 'true' si estamos en una pantalla
// que pertenece a esa opción (detalle, edición...); sin atributo si no.
const marcaActual = (pathname, destino, activa) =>
  pathname === destino ? 'page' : activa ? 'true' : undefined

// onNavegar es opcional: en móvil el menú es un cajón y necesita cerrarse
// cuando se elige una opción. Conserva la navegación normal del enlace.
export default function SidebarItem({ item, onNavegar }) {
  const { pathname } = useLocation()
  const idPanel = useId()
  const hijos = item.children ?? []
  // Un módulo con un solo hijo visible no necesita acordeón: se muestra como
  // enlace directo (por ejemplo, el aspirante solo tiene 'Listado'). La opción
  // `acordeon: true` del menú fuerza el acordeón aunque haya un solo hijo.
  const tieneHijos = hijos.length > 1 || item.acordeon === true
  // Opción del menú a la que pertenece la pantalla actual (detalle, edición y
  // alias incluidos), no solo la coincidencia exacta de la dirección.
  const activo = destinoDeMenu(pathname)
  const hijoActivo = tieneHijos && hijos.some((hijo) => hijo.to === activo)
  const [abierto, setAbierto] = useState(hijoActivo)

  // Si se llega a una pantalla de este módulo desde fuera del menú (un botón de
  // Inicio, por ejemplo), el acordeón se abre solo para mostrar dónde se está.
  // Se ajusta durante el render, solo cuando cambia la dirección.
  const [rutaVista, setRutaVista] = useState(pathname)
  if (rutaVista !== pathname) {
    setRutaVista(pathname)
    if (hijoActivo && !abierto) setAbierto(true)
  }

  // Opción simple: un link directo
  if (!tieneHijos) {
    const destino = hijos.length === 1 ? hijos[0].to : item.to
    const esActivo = activo === destino
    return (
      <Link
        to={destino}
        onClick={onNavegar}
        aria-current={marcaActual(pathname, destino, esActivo)}
        className={`${CLASE_BASE} ${esActivo ? CLASE_ACTIVO : CLASE_REPOSO}`}
      >
        <Icono nombre={item.icono} className={claseIcono(esActivo)} />
        <span className="min-w-0 truncate">{item.label}</span>
      </Link>
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
          {item.children.map((hijo) => {
            const esActivo = activo === hijo.to
            return (
              <Link
                key={hijo.to}
                to={hijo.to}
                onClick={onNavegar}
                aria-current={marcaActual(pathname, hijo.to, esActivo)}
                className={`${CLASE_BASE} ${esActivo ? CLASE_ACTIVO : CLASE_REPOSO}`}
              >
                {hijo.label}
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
