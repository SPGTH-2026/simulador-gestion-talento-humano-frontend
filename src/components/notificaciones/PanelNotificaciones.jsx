import { forwardRef } from 'react'
import { Link } from 'react-router-dom'
import Boton from '../ui/Boton'
import Icono from '../ui/Icono'
import { MensajeError } from '../ui/Mensaje'
import { CLASE_BOTON_ICONO, CLASE_CHIP, CLASE_TARJETA, CLASE_TEXTO_FUERTE, CLASE_TEXTO_SUAVE } from '../../lib/estilos'
import { FILTROS_PANEL } from '../../lib/notificaciones'
import { POR_PAGINA_PANEL, refrescarNotificaciones, useAlmacenNotificaciones } from './almacenNotificaciones'
import CargandoNotificaciones from './CargandoNotificaciones'
import FilaNotificacion from './FilaNotificacion'
import FiltrosNotificaciones from './FiltrosNotificaciones'
import VacioNotificaciones from './VacioNotificaciones'
import { useAccionesAviso } from './useAccionesAviso'

// Panel desplegable de la campana: las notificaciones recientes sin salir de la pantalla. Abrirlo NO marca nada como leído; se marca al
// consultar un aviso. Mientras llega la lista se ve «Cargando notificaciones…» con su rueda (nunca un «vacío» antes de saber). Distribución: cabecera (título, pendientes y cierre), filtros, cuerpo con la altura de su contenido y desplazamiento
// interno a partir de un máximo, y pie discreto con «Ver todas». El título lleva el foco al abrir (el lector anuncia «Notificaciones»).
const PanelNotificaciones = forwardRef(function PanelNotificaciones({ id, cerrar, cerrarYEnfocar, refTitulo, className }, ref) {
  const { items, total, filtro, filtroItems, noLeidas, fase, error } = useAlmacenNotificaciones()
  const acciones = useAccionesAviso({ alAbrir: cerrar })
  const hayDatos = filtroItems === filtro
  const sinDatos = items.length === 0
  const reintentar = () => refrescarNotificaciones(filtro)

  return (
    <section ref={ref} id={id} role="dialog" aria-modal="false" aria-labelledby={`${id}-titulo`} className={`${CLASE_TARJETA} flex flex-col shadow-xl ${className}`}>
      <header className="flex shrink-0 items-center gap-1 py-1.5 pl-4 pr-2">
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-3 gap-y-1">
          <h2 id={`${id}-titulo`} ref={refTitulo} tabIndex={-1} className={`text-base font-semibold focus-visible:outline-none ${CLASE_TEXTO_FUERTE}`}>Notificaciones</h2>
          {noLeidas > 0 && <span className={CLASE_CHIP}>{noLeidas} sin leer</span>}
        </div>
        <button type="button" onClick={cerrarYEnfocar} aria-label="Cerrar notificaciones" className={CLASE_BOTON_ICONO}>
          <Icono nombre="cerrar" />
        </button>
      </header>

      <FiltrosNotificaciones opciones={FILTROS_PANEL} valor={filtro} onCambiar={refrescarNotificaciones} className="shrink-0 border-b border-sena-linea px-3 pb-2 dark:border-sena-borde/60" />

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-3" aria-busy={fase === 'cargando' || undefined}>
        {(acciones.errorAccion || (error && hayDatos && !sinDatos)) && (
          <div className="mb-3 flex flex-col items-start gap-2">
            <MensajeError>{acciones.errorAccion || error}</MensajeError>
            {!acciones.errorAccion && <Boton variante="contorno" tamano="tactil" onClick={reintentar}>Reintentar</Boton>}
          </div>
        )}
        {!hayDatos && fase !== 'error' && <CargandoNotificaciones />}
        {fase === 'error' && !hayDatos && (
          <div className="flex flex-col items-start gap-2">
            <MensajeError>{error}</MensajeError>
            <Boton variante="contorno" tamano="tactil" onClick={reintentar}>Reintentar</Boton>
          </div>
        )}
        {hayDatos && sinDatos && <VacioNotificaciones filtro={filtro} compacto />}
        {hayDatos && !sinDatos && (
          <ul className="flex flex-col gap-2" aria-label="Notificaciones recientes">
            {items.map((item) => (
              <FilaNotificacion
                key={item.id}
                item={item}
                compacta
                ocupado={acciones.ocupadoId === item.id}
                onAbrir={acciones.abrir}
                onMarcar={acciones.marcar}
                onOcultar={acciones.ocultar}
              />
            ))}
          </ul>
        )}
      </div>

      <footer className="flex shrink-0 items-center justify-between gap-2 border-t border-sena-linea px-3 dark:border-sena-borde/60">
        <span className={`text-xs ${CLASE_TEXTO_SUAVE}`}>{hayDatos && total > POR_PAGINA_PANEL ? `Las ${POR_PAGINA_PANEL} más recientes de ${total}` : ''}</span>
        <Link
          to="/notificaciones?filtro=todas"
          onClick={cerrar}
          aria-label="Ver todas las notificaciones"
          className="inline-flex min-h-11 items-center rounded-lg px-3 text-sm font-medium text-slate-700 hover:bg-sena-hundido/60 hover:text-sena-azul focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sena/60 dark:text-sena-texto dark:hover:bg-white/10"
        >
          Ver todas
        </Link>
      </footer>
    </section>
  )
})

export default PanelNotificaciones
