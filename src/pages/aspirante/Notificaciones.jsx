import Boton from '../../components/ui/Boton'
import Paginacion from '../../components/ui/Paginacion'
import { MensajeError } from '../../components/ui/Mensaje'
import CargandoNotificaciones from '../../components/notificaciones/CargandoNotificaciones'
import FilaNotificacion from '../../components/notificaciones/FilaNotificacion'
import FiltrosNotificaciones from '../../components/notificaciones/FiltrosNotificaciones'
import VacioNotificaciones from '../../components/notificaciones/VacioNotificaciones'
import { CLASE_SUBTITULO_PAGINA, CLASE_TITULO_PAGINA } from '../../lib/estilos'
import { FILTROS_PAGINA } from '../../lib/notificaciones'
import { useNotificaciones } from './useNotificaciones'

// Plazo de retención: lo informa el servidor (`meta.retencion`: días, o null si la depuración está desactivada). Solo se anuncia si existe.
function notaDelFiltro(filtro, retencion) {
  if (filtro === 'ocultas') {
    const plazo = retencion ? `Se eliminan ${retencion.ocultas_dias} días después de ocultarlas; r` : 'R'
    return `Las notificaciones ocultas no cuentan como pendientes y conservan su estado de lectura. ${plazo}estaura una para verla de nuevo en Todas.`
  }
  if (filtro === 'leidas' && retencion) return `Las notificaciones leídas se eliminan ${retencion.leidas_dias} días después de leerlas.`
  return null
}

export default function Notificaciones() {
  const n = useNotificaciones()
  const sinDatos = n.items.length === 0
  const nota = notaDelFiltro(n.filtro, n.meta.retencion)

  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className={CLASE_TITULO_PAGINA}>Notificaciones</h1>
          <p className={CLASE_SUBTITULO_PAGINA}>Avisos de tu actividad en el sistema según tu rol.</p>
        </div>
        {n.noLeidas > 0 && n.filtro !== 'ocultas' && (
          <Boton variante="contorno" onClick={n.marcarTodas} ocupado={n.ocupado}>
            Marcar todas como leídas
          </Boton>
        )}
      </header>

      <FiltrosNotificaciones opciones={FILTROS_PAGINA} valor={n.filtro} onCambiar={n.cambiarFiltro} />
      {nota && <p className="text-sm text-slate-600 dark:text-sena-texto-suave">{nota}</p>}

      {n.error && (
        <div className="flex flex-col items-start gap-2">
          <MensajeError>{n.error}</MensajeError>
          <Boton variante="contorno" tamano="tactil" onClick={n.recargar}>Reintentar</Boton>
        </div>
      )}

      {n.cargando ? <CargandoNotificaciones /> : sinDatos ? (
        !n.error && <VacioNotificaciones filtro={n.filtro} />
      ) : (
        <ul className="space-y-2" aria-label="Lista de notificaciones">
          {n.items.map((item) => (
            <FilaNotificacion
              key={item.id}
              item={item}
              ocupado={n.acciones.ocupadoId === item.id}
              onAbrir={n.acciones.abrir}
              onMarcar={n.acciones.marcar}
              onOcultar={n.acciones.ocultar}
              onRestaurar={n.filtro === 'ocultas' ? n.acciones.restaurar : undefined}
            />
          ))}
        </ul>
      )}

      {!n.cargando && n.items.length > 0 && (
        <Paginacion
          meta={n.meta}
          singular="notificación"
          plural="notificaciones"
          etiqueta="Paginación de notificaciones"
          onPagina={n.setPagina}
          className="px-1"
        />
      )}
    </div>
  )
}
