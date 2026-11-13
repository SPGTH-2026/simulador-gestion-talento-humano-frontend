import { useCallback, useState } from 'react'
import { useAuth } from '../../auth/useAuth'
import EtiquetaEstado from '../../components/convocatorias/EtiquetaEstado'
import useConvocatoriaDeUrl from '../../hooks/useConvocatoriaDeUrl'
import ListaConvocatorias from '../../components/seleccion/ListaConvocatorias'
import PanelFinalistas from '../../components/seleccion/PanelFinalistas'
import PanelRanking from '../../components/seleccion/PanelRanking'
import Boton from '../../components/ui/Boton'
import { MensajeError } from '../../components/ui/Mensaje'
import Pestanas from '../../components/ui/Pestanas'
import useFiltrosUrl from '../../hooks/useFiltrosUrl'
import {
  CLASE_CHIP,
  CLASE_TARJETA_PLANA,
  CLASE_TEXTO_FUERTE,
  CLASE_TEXTO_PARTIDO,
  CLASE_TEXTO_SUAVE,
  CLASE_TITULO_PAGINA,
} from '../../lib/estilos'
import { tituloConvocatoria } from '../../lib/seleccion'

// La convocatoria y la pestaña viven en la URL: sobreviven a recargar y se pueden compartir.
const CLAVES = ['convocatoria', 'pestana']

export default function SeleccionRanking() {
  const { can } = useAuth()
  const { valores, setValores } = useFiltrosUrl(CLAVES)
  const [datos, setDatos] = useState(null)
  // Sube cuando la lista de finalistas pudo quedar distinta de la que se vio (una confirmación o un 409): la
  // pestaña Finalistas la vuelve a pedir la próxima vez que se muestre.
  const [invalidacion, setInvalidacion] = useState(0)

  const convocatoriaId = valores.convocatoria
  const pestana = valores.pestana === 'finalistas' ? 'finalistas' : 'ranking'

  const elegir = useCallback(
    (convocatoria) => {
      setDatos(convocatoria)
      setValores({ convocatoria: convocatoria.id, pestana: '' }, { reemplazar: false })
    },
    [setValores],
  )

  const cambiarPestana = (id) => setValores({ pestana: id === 'ranking' ? '' : id })

  // Los datos de la convocatoria (y su estado, que decide si se puede elegir) siguen al ID de la URL: la fila tocada si es
  // esa, o una consulta propia por ese ID que no depende de la página del listado. Ya no hace falta pedir la
  // configuración solo para conocer el estado.
  const resuelta = useConvocatoriaDeUrl(convocatoriaId, datos)
  const actual = resuelta.datos
  const codigoEstado = actual?.estado?.codigo ?? null
  // null = aún se desconoce: no se afirma nada hasta saberlo.
  const enProceso = codigoEstado == null ? null : codigoEstado === 'en_proceso'

  return (
    <div className="flex flex-col gap-4">
      <h1 className={`${CLASE_TITULO_PAGINA} text-balance`}>Ranking y finalistas</h1>

      <div className="@container">
        <div className="grid items-start gap-x-6 gap-y-4 @min-[900px]:grid-cols-[minmax(17.5rem,20rem)_minmax(0,1fr)]">
          <ListaConvocatorias
            seleccionadaId={convocatoriaId}
            etiquetaSeleccionada={actual ? tituloConvocatoria(actual) : undefined}
            onElegir={elegir}
            className="@min-[900px]:sticky @min-[900px]:top-2 @min-[900px]:max-h-[calc(100dvh-10rem)]"
          />

          {!convocatoriaId ? (
            <section
              aria-label="Detalle de la convocatoria"
              className={`${CLASE_TARJETA_PLANA} flex flex-col items-center gap-1 px-6 py-8 text-center`}
            >
              <h2 className={`text-base font-semibold ${CLASE_TEXTO_FUERTE}`}>Elige una convocatoria</h2>
              <p className={`max-w-md text-sm ${CLASE_TEXTO_SUAVE}`}>Verás el ranking de sus candidatos listos y podrás confirmar a los finalistas.</p>
            </section>
          ) : (
            <section id="detalle-convocatoria" aria-labelledby="titulo-detalle" className="flex min-w-0 flex-col gap-3">
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
                    <span className={`text-sm ${CLASE_TEXTO_SUAVE}`}>
                      {actual.vacantes} {actual.vacantes === 1 ? 'vacante' : 'vacantes'}
                    </span>
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

              {/* Cada panel pide sus datos cuando su pestaña está a la vista (prop 'activo'); Pestanas los deja
                  montados para no perder lo elegido al cambiar de pestaña. */}
              <Pestanas
                key={convocatoriaId}
                className="flex flex-col gap-3"
                etiquetaAccesible="Ranking y finalistas de la convocatoria"
                activaId={pestana}
                onCambiar={cambiarPestana}
                pestanas={[
                  {
                    id: 'ranking',
                    etiqueta: 'Ranking',
                    contenido: (
                      <PanelRanking
                        key={convocatoriaId}
                        convocatoriaId={convocatoriaId}
                        activo={pestana === 'ranking'}
                        enProceso={enProceso}
                        puedeDecidir={can('seleccion:decidir')}
                        onConfirmada={() => setInvalidacion((n) => n + 1)}
                      />
                    ),
                  },
                  {
                    id: 'finalistas',
                    etiqueta: 'Finalistas',
                    contenido: (
                      <PanelFinalistas
                        key={convocatoriaId}
                        convocatoriaId={convocatoriaId}
                        activo={pestana === 'finalistas'}
                        invalidacion={invalidacion}
                      />
                    ),
                  },
                ]}
              />
            </section>
          )}
        </div>
      </div>
    </div>
  )
}
