import EtiquetaEstado from '../convocatorias/EtiquetaEstado'
import Boton from '../ui/Boton'
import { MensajeError } from '../ui/Mensaje'
import ChipModalidad from './ChipModalidad'
import ListaConvocatorias from './ListaConvocatorias'
import {
  CLASE_CHIP,
  CLASE_TARJETA_PLANA,
  CLASE_TEXTO_FUERTE,
  CLASE_TEXTO_PARTIDO,
  CLASE_TEXTO_SUAVE,
  CLASE_TITULO_PAGINA,
} from '../../lib/estilos'
import { tituloConvocatoria } from '../../lib/seleccion'

// Estructura común de Preselección, Ranking y Decidir: título, lista de convocatorias a la izquierda y, a la derecha, la
// cabecera de la convocatoria elegida y su contenido ('children'). Cada pantalla pone sus pestañas, resumen, avisos y
// acciones dentro de 'children', en ese orden.
// Ancho: la lista mide 16-20 rem y pasa a 19-24 rem solo desde 1100 px de contenedor, para que el panel de la derecha conserve
// el espacio (a 1242 px de ventana el contenedor mide ~930 px y el panel queda en ~590 px en vez de ~525).
const REJILLA =
  'grid items-start gap-x-6 gap-y-4 @min-[900px]:grid-cols-[minmax(16rem,20rem)_minmax(0,1fr)] @min-[1100px]:grid-cols-[minmax(19rem,24rem)_minmax(0,1fr)]'

export default function PaginaSeleccion({
  titulo,
  textoVacio,
  convocatoriaId,
  actual,
  resuelta,
  modalidad,
  conVacantes = true,
  onElegir,
  filtroEstado,
  onFiltroEstado,
  children,
}) {
  return (
    <div className="flex flex-col gap-4">
      <h1 className={`${CLASE_TITULO_PAGINA} text-balance`}>{titulo}</h1>

      <div className="@container">
        <div className={REJILLA}>
          <ListaConvocatorias
            seleccionadaId={convocatoriaId}
            etiquetaSeleccionada={actual ? tituloConvocatoria(actual) : undefined}
            onElegir={onElegir}
            filtroEstado={filtroEstado}
            onFiltroEstado={onFiltroEstado}
            codigoEstadoSeleccionada={actual?.estado?.codigo}
            className="@min-[900px]:sticky @min-[900px]:top-2 @min-[900px]:max-h-[calc(100dvh-10rem)]"
          />

          {!convocatoriaId ? (
            <section
              aria-label="Detalle de la convocatoria"
              className={`${CLASE_TARJETA_PLANA} flex flex-col items-center gap-1 px-6 py-8 text-center`}
            >
              <h2 className={`text-base font-semibold ${CLASE_TEXTO_FUERTE}`}>Elige una convocatoria</h2>
              <p className={`max-w-md text-sm ${CLASE_TEXTO_SUAVE}`}>{textoVacio}</p>
            </section>
          ) : (
            <section id="detalle-convocatoria" aria-labelledby="titulo-detalle" className="flex min-w-0 flex-col gap-3">
              {/* Cabecera: nombre y, debajo, estado, código, vacantes y modalidad en una sola línea que se parte si hace falta. */}
              <header className="flex flex-col gap-1.5">
                <h2
                  id="titulo-detalle"
                  className={`text-xl font-semibold leading-snug text-balance ${CLASE_TEXTO_PARTIDO} ${CLASE_TEXTO_FUERTE}`}
                >
                  {actual ? tituloConvocatoria(actual) : `Convocatoria ${convocatoriaId}`}
                </h2>
                {actual && (
                  <p className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                    <EtiquetaEstado codigo={actual.estado?.codigo} nombre={actual.estado?.nombre} />
                    {actual.codigo && <span className={CLASE_CHIP}>{actual.codigo}</span>}
                    {conVacantes && (
                      <span className={`text-sm ${CLASE_TEXTO_SUAVE}`}>
                        {actual.vacantes} {actual.vacantes === 1 ? 'vacante' : 'vacantes'}
                      </span>
                    )}
                    <ChipModalidad {...modalidad} />
                  </p>
                )}
              </header>

              {resuelta.error && (
                <div className="flex flex-col items-start gap-2">
                  <MensajeError>No se pudieron cargar los datos de esta convocatoria. {resuelta.error}</MensajeError>
                  <Boton variante="contorno" tamano="tactil" onClick={resuelta.reintentar}>
                    Reintentar
                  </Boton>
                </div>
              )}

              {children}
            </section>
          )}
        </div>
      </div>
    </div>
  )
}
