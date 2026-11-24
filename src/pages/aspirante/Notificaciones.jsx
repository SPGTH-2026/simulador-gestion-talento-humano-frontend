import Boton from '../../components/ui/Boton'
import Cargando from '../../components/ui/Cargando'
import EstadoVacio from '../../components/ui/EstadoVacio'
import Paginacion from '../../components/ui/Paginacion'
import { MensajeError } from '../../components/ui/Mensaje'
import { formatearFechaHora } from '../../lib/ventanaPostulacion'
import {
  CLASE_CHIP,
  CLASE_SUBTITULO_PAGINA,
  CLASE_TARJETA,
  CLASE_TEXTO_FUERTE,
  CLASE_TEXTO_SUAVE,
  CLASE_TITULO_PAGINA,
} from '../../lib/estilos'
import { useNotificaciones } from './useNotificaciones'

export default function Notificaciones() {
  const n = useNotificaciones()

  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className={CLASE_TITULO_PAGINA}>Notificaciones</h1>
          <p className={CLASE_SUBTITULO_PAGINA}>Avisos de tu actividad en el sistema según tu rol.</p>
        </div>
        {n.noLeidas > 0 && (
          <Boton variante="contorno" onClick={n.marcarTodas} ocupado={n.ocupado}>
            Marcar todas como leídas
          </Boton>
        )}
      </header>

      {n.error && <MensajeError>{n.error}</MensajeError>}

      {n.cargando ? (
        <Cargando>Cargando notificaciones…</Cargando>
      ) : n.items.length === 0 ? (
        <EstadoVacio
          titulo="No tienes notificaciones"
          descripcion="Aquí aparecerán los avisos que correspondan a tu rol."
        />
      ) : (
        <ul className="space-y-2" aria-label="Lista de notificaciones">
          {n.items.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => n.abrir(item)}
                aria-label={item.leida ? undefined : `${item.titulo} (sin leer)`}
                className={`${CLASE_TARJETA} w-full p-4 text-left transition-colors hover:bg-sena-hundido/60 dark:hover:bg-white/5 ${
                  item.leida ? '' : 'border-sena-azul/50 dark:border-sena-texto-suave/60'
                }`}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className={`text-sm font-semibold ${CLASE_TEXTO_FUERTE}`}>{item.titulo}</h2>
                  {!item.leida && <span className={CLASE_CHIP} aria-hidden="true">Nueva</span>}
                </div>
                <p className={`mt-1 text-sm ${CLASE_TEXTO_SUAVE}`}>{item.mensaje}</p>
                <time dateTime={item.created_at} className={`mt-2 block text-xs ${CLASE_TEXTO_SUAVE}`}>
                  {formatearFechaHora(item.created_at)}
                </time>
              </button>
            </li>
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
