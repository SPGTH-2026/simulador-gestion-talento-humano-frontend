import { useEffect, useId, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import Icono from '../ui/Icono'
import { CLASE_BOTON_ICONO } from '../../lib/estilos'
import { refrescarNotificaciones } from './almacenNotificaciones'
import PanelNotificaciones from './PanelNotificaciones'
import { useContadorNotificaciones } from './useContadorNotificaciones'

// Campana de la barra superior: muestra cuántos avisos quedan sin leer (con cero, sin insignia) y abre un panel con las recientes.
// El panel se ancla al borde derecho de la barra superior (con el mismo margen que ella) y debajo de ella; en móvil ocupa el ancho
// disponible. Es un diálogo NO modal (lleva enlaces y acciones, no opciones de menú): no bloquea ni mueve la pantalla de fondo.
// Se cierra con la campana, su botón, un clic fuera, Escape, al salir el foco de él o al cambiar de ruta. Al cerrar con campana, botón
// o Escape el foco vuelve a la campana; con clic fuera o al salir el foco no se le quita al control elegido.
export default function CampanaNotificaciones() {
  const noLeidas = useContadorNotificaciones(true)
  const idPanel = useId()
  const { key: rutaActual, pathname } = useLocation()
  // Abierto solo en la ruta donde se abrió: al navegar se cierra sin necesidad de un efecto.
  const [abiertoEn, setAbiertoEn] = useState(null)
  const abierto = abiertoEn === rutaActual
  const refRaiz = useRef(null)
  const refBoton = useRef(null)
  const refTitulo = useRef(null)
  // Activa (patrón de SPGTH: tinte suave y texto azul) mientras el panel está abierto o estamos en /notificaciones. No indica avisos
  // nuevos: eso lo dice solo el contador.
  const enPagina = pathname === '/notificaciones'
  const activa = abierto || enPagina
  const etiqueta = noLeidas > 0 ? `Notificaciones, ${noLeidas} sin leer` : 'Notificaciones'

  const cerrar = () => setAbiertoEn(null)
  const cerrarYEnfocar = () => {
    setAbiertoEn(null)
    refBoton.current?.focus()
  }
  const alternar = () => {
    if (abierto) return cerrarYEnfocar()
    setAbiertoEn(rutaActual)
    refrescarNotificaciones()
  }

  // Al abrir, el foco pasa al título del panel.
  useEffect(() => {
    if (abierto) refTitulo.current?.focus()
  }, [abierto])

  useEffect(() => {
    if (!abierto) return undefined
    const alTeclear = (e) => {
      if (e.key !== 'Escape' || e.defaultPrevented) return
      e.preventDefault()
      setAbiertoEn(null)
      refBoton.current?.focus()
    }
    const alPulsarFuera = (e) => {
      if (!refRaiz.current?.contains(e.target)) setAbiertoEn(null)
    }
    document.addEventListener('keydown', alTeclear)
    document.addEventListener('pointerdown', alPulsarFuera)
    return () => {
      document.removeEventListener('keydown', alTeclear)
      document.removeEventListener('pointerdown', alPulsarFuera)
    }
  }, [abierto])

  return (
    <div
      ref={refRaiz}
      onBlur={(e) => {
        if (abierto && e.relatedTarget && !refRaiz.current?.contains(e.relatedTarget)) cerrar()
      }}
    >
      <button
        ref={refBoton}
        type="button"
        onClick={alternar}
        aria-label={etiqueta}
        aria-haspopup="dialog"
        aria-expanded={abierto}
        aria-current={enPagina ? 'page' : undefined}
        aria-controls={abierto ? idPanel : undefined}
        className={`${CLASE_BOTON_ICONO} relative focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sena/60 ${activa ? 'bg-sena-hundido text-sena-azul dark:bg-white/10 dark:text-white' : ''}`}
      >
        <Icono nombre="campana" />
        {noLeidas > 0 && (
          <span
            aria-hidden="true"
            className="absolute -right-0.5 -top-0.5 grid min-w-5 place-items-center rounded-full bg-red-600 px-1 text-[11px] font-semibold leading-5 text-white tabular-nums"
          >
            {noLeidas > 99 ? '99+' : noLeidas}
          </span>
        )}
      </button>
      {abierto && (
        <PanelNotificaciones
          id={idPanel}
          cerrar={cerrar}
          cerrarYEnfocar={cerrarYEnfocar}
          refTitulo={refTitulo}
          className="fixed inset-x-3 top-[4.5rem] z-40 max-h-[calc(100dvh-6.5rem)] sm:inset-x-auto sm:right-6 sm:w-[26rem] sm:max-h-[min(36rem,calc(100dvh-5.5rem))] lg:right-8"
        />
      )}
    </div>
  )
}
