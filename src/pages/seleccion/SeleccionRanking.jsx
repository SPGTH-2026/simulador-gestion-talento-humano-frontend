import { useCallback, useState } from 'react'
import { useAuth } from '../../auth/useAuth'
import ComparadorCandidatos from '../../components/seleccion/ComparadorCandidatos'
import PaginaSeleccion from '../../components/seleccion/PaginaSeleccion'
import PanelFinalistas from '../../components/seleccion/PanelFinalistas'
import PanelRanking from '../../components/seleccion/PanelRanking'
import Pestanas from '../../components/ui/Pestanas'
import useConvocatoriaDeUrl from '../../hooks/useConvocatoriaDeUrl'
import useFiltroEstadoSeleccion from '../../hooks/useFiltroEstadoSeleccion'
import useFiltrosUrl from '../../hooks/useFiltrosUrl'
import useMarcasComparacion from '../../hooks/useMarcasComparacion'
import useModalidadConvocatoria from '../../hooks/useModalidadConvocatoria'

// La convocatoria y la pestaña viven en la URL: sobreviven a recargar y se pueden compartir.
const CLAVES = ['convocatoria', 'pestana', 'estado']

export default function SeleccionRanking() {
  const { can } = useAuth()
  const { valores, setValores } = useFiltrosUrl(CLAVES)
  const [datos, setDatos] = useState(null)
  // Sube cuando la lista de finalistas pudo quedar distinta de la que se vio (una confirmación o un 409): la
  // pestaña Finalistas la vuelve a pedir la próxima vez que se muestre.
  const [invalidacion, setInvalidacion] = useState(0)

  const convocatoriaId = valores.convocatoria
  const [filtroEstado, cambiarFiltroEstado] = useFiltroEstadoSeleccion(valores.estado, setValores)
  // Marcas para comparar (CU-SEL-017): de la convocatoria a la vista, compartidas por Ranking y Finalistas.
  const comparacion = useMarcasComparacion(convocatoriaId)
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
  // esa, o una consulta propia por ese ID que no depende de la página del listado.
  const resuelta = useConvocatoriaDeUrl(convocatoriaId, datos)
  const modalidad = useModalidadConvocatoria(convocatoriaId)
  const codigoEstado = resuelta.datos?.estado?.codigo ?? null
  // null = aún se desconoce: no se afirma nada hasta saberlo.
  const enProceso = codigoEstado == null ? null : codigoEstado === 'en_proceso'

  return (
    <>
      <PaginaSeleccion
        titulo="Ranking y finalistas"
        textoVacio="Verás el ranking de sus candidatos listos y podrás confirmar a los finalistas."
        convocatoriaId={convocatoriaId}
        actual={resuelta.datos}
        resuelta={resuelta}
        modalidad={modalidad}
        onElegir={elegir}
        filtroEstado={filtroEstado}
        onFiltroEstado={cambiarFiltroEstado}
      >
        {/* Cada panel pide sus datos cuando su pestaña está a la vista (prop 'activo'); Pestanas los deja montados para no
            perder lo elegido al cambiar de pestaña. */}
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
                  comparacion={comparacion}
                  modalidad={modalidad}
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
                  comparacion={comparacion}
                />
              ),
            },
          ]}
        />
      </PaginaSeleccion>

      {/* Solo lectura: abrirlo y cerrarlo no toca las marcas de comparar ni la elección de finalistas del Ranking. */}
      {comparacion.abierto && (
        <ComparadorCandidatos convocatoriaId={convocatoriaId} ids={[...comparacion.marcas.keys()]} onCerrar={comparacion.cerrar} />
      )}
    </>
  )
}
