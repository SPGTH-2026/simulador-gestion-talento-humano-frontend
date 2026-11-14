import { useCallback, useState } from 'react'
import { useAuth } from '../../auth/useAuth'
import EtiquetaEstado from '../../components/convocatorias/EtiquetaEstado'
import useConvocatoriaDeUrl from '../../hooks/useConvocatoriaDeUrl'
import ListaConvocatorias from '../../components/seleccion/ListaConvocatorias'
import PanelCandidatos from '../../components/seleccion/PanelCandidatos'
import PanelConfiguracion from '../../components/seleccion/PanelConfiguracion'
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
import { estadoFiltroValido, tituloConvocatoria } from '../../lib/seleccion'

// La convocatoria y la pestaña viven en la URL: sobreviven a recargar y se pueden compartir.
const CLAVES = ['convocatoria', 'pestana', 'estado']

export default function Preseleccion() {
  const { can } = useAuth()
  const { valores, setValores } = useFiltrosUrl(CLAVES)
  // Datos de la convocatoria elegida (nombre, estado...). El id manda: viene de la URL.
  const [datos, setDatos] = useState(null)

  const convocatoriaId = valores.convocatoria
  const pestana = valores.pestana === 'configuracion' ? 'configuracion' : 'candidatos'

  const elegir = useCallback(
    (convocatoria) => {
      setDatos(convocatoria)
      setValores({ convocatoria: convocatoria.id, pestana: '' }, { reemplazar: false })
    },
    [setValores],
  )

  const cambiarPestana = (id) => setValores({ pestana: id === 'candidatos' ? '' : id })

  // Los datos de la convocatoria siguen al ID de la URL: la fila tocada si es esa, o una consulta propia por ese ID
  // (enlace directo, atrás/adelante) que no depende de la página del listado.
  const resuelta = useConvocatoriaDeUrl(convocatoriaId, datos)
  const actual = resuelta.datos

  return (
    <div className="flex flex-col gap-4">
      <h1 className={`${CLASE_TITULO_PAGINA} text-balance`}>Preselección</h1>

      <div className="@container">
        {/* Lista de navegación de 280 a 320 px y el detalle con todo el ancho restante. En pantallas estrechas la
            lista se pliega en un botón sobre el detalle. */}
        <div className="grid items-start gap-x-6 gap-y-4 @min-[900px]:grid-cols-[minmax(17.5rem,20rem)_minmax(0,1fr)]">
          <ListaConvocatorias
            seleccionadaId={convocatoriaId}
            etiquetaSeleccionada={actual ? tituloConvocatoria(actual) : undefined}
            onElegir={elegir}
            filtroEstado={estadoFiltroValido(valores.estado)}
            onFiltroEstado={(estado) => setValores({ estado })}
            className="@min-[900px]:sticky @min-[900px]:top-2 @min-[900px]:max-h-[calc(100dvh-10rem)]"
          />

          {!convocatoriaId ? (
            <section
              aria-label="Detalle de la convocatoria"
              className={`${CLASE_TARJETA_PLANA} flex flex-col items-center gap-1 px-6 py-8 text-center`}
            >
              <h2 className={`text-base font-semibold ${CLASE_TEXTO_FUERTE}`}>Elige una convocatoria</h2>
              <p className={`max-w-md text-sm ${CLASE_TEXTO_SUAVE}`}>Verás sus candidatos y su configuración de actividades.</p>
            </section>
          ) : (
            <section id="detalle-convocatoria" aria-labelledby="titulo-detalle" className="flex min-w-0 flex-col gap-3">
              {/* Encabezado compacto: nombre, y debajo estado, código y vacantes en una sola línea. */}
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

              {/* key = convocatoria: al cambiar, cada panel nace de cero (página 1, sin datos
                  de la anterior) y sus respuestas tardías se descartan. */}
              <Pestanas
                key={convocatoriaId}
                className="flex flex-col gap-3"
                etiquetaAccesible="Preselección de la convocatoria"
                activaId={pestana}
                onCambiar={cambiarPestana}
                pestanas={[
                  {
                    id: 'candidatos',
                    etiqueta: 'Candidatos',
                    contenido: (
                      <PanelCandidatos
                        key={convocatoriaId}
                        convocatoriaId={convocatoriaId}
                        activo={pestana === 'candidatos'}
                      />
                    ),
                  },
                  {
                    id: 'configuracion',
                    etiqueta: 'Configuración',
                    contenido: (
                      <PanelConfiguracion
                        key={convocatoriaId}
                        convocatoriaId={convocatoriaId}
                        activo={pestana === 'configuracion'}
                        puedeDecidir={can('seleccion:decidir')}
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
