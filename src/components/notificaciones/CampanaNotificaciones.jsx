import { Link } from 'react-router-dom'
import Icono from '../ui/Icono'
import { CLASE_BOTON_ICONO } from '../../lib/estilos'
import { useContadorNotificaciones } from './useContadorNotificaciones'

// Botón de la campana de la barra superior. Muestra cuántos avisos quedan sin leer; con cero, no hay insignia.
export default function CampanaNotificaciones() {
  const noLeidas = useContadorNotificaciones(true)
  const etiqueta = noLeidas > 0 ? `Notificaciones, ${noLeidas} sin leer` : 'Notificaciones'

  return (
    <Link to="/notificaciones" className={`${CLASE_BOTON_ICONO} relative`} aria-label={etiqueta}>
      <Icono nombre="campana" />
      {noLeidas > 0 && (
        <span
          aria-hidden="true"
          className="absolute -right-0.5 -top-0.5 grid min-w-5 place-items-center rounded-full bg-red-600 px-1 text-[11px] font-semibold leading-5 text-white tabular-nums"
        >
          {noLeidas > 99 ? '99+' : noLeidas}
        </span>
      )}
    </Link>
  )
}
