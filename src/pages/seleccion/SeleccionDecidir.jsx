import { useCallback, useState } from 'react'
import { useAuth } from '../../auth/useAuth'
import EtiquetaEstado from '../../components/convocatorias/EtiquetaEstado'
import useConvocatoriaDeUrl from '../../hooks/useConvocatoriaDeUrl'
import ListaConvocatorias from '../../components/seleccion/ListaConvocatorias'
import PanelDecisiones from '../../components/seleccion/PanelDecisiones'
import Boton from '../../components/ui/Boton'
import { MensajeError } from '../../components/ui/Mensaje'
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

// La convocatoria vive en la URL: sobrevive a recargar y se puede compartir.
const CLAVES = ['convocatoria']

// Etapa 6 de Selección: decisiones sobre los finalistas y control de cupos. La pantalla exige seleccion:decidir (guard de
// la ruta); la API de lectura pide seleccion:ver y la de escritura seleccion:decidir. Los botones de escritura salen según
// el permiso real, no solo por llegar a la pantalla.
export default function SeleccionDecidir() {
  const { can } = useAuth()
  const { valores, setValores } = useFiltrosUrl(CLAVES)
  const [datos, setDatos] = useState(null)

  const convocatoriaId = valores.convocatoria

  const elegir = useCallback(
    (convocatoria) => {
      setDatos(convocatoria)
      setValores({ convocatoria: convocatoria.id }, { reemplazar: false })
    },
    [setValores],
  )

  const resuelta = useConvocatoriaDeUrl(convocatoriaId, datos)
  const actual = resuelta.datos
  const codigoEstado = actual?.estado?.codigo ?? null
  // null = aún se desconoce: no se afirma nada hasta saberlo.
  const enProceso = codigoEstado == null ? null : codigoEstado === 'en_proceso'

  return (
    <div className="flex flex-col gap-4">
      <h1 className={`${CLASE_TITULO_PAGINA} text-balance`}>Decidir selección</h1>

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
              <p className={`max-w-md text-sm ${CLASE_TEXTO_SUAVE}`}>
                Verás los cupos, los finalistas de la lista vigente y podrás registrar o rectificar sus decisiones.
              </p>
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

              <PanelDecisiones
                key={convocatoriaId}
                convocatoriaId={convocatoriaId}
                enProceso={enProceso}
                puedeDecidir={can('seleccion:decidir')}
              />
            </section>
          )}
        </div>
      </div>
    </div>
  )
}
