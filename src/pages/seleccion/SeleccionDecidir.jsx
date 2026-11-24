import { useCallback, useState } from 'react'
import { useAuth } from '../../auth/useAuth'
import PaginaSeleccion from '../../components/seleccion/PaginaSeleccion'
import PanelDecisiones from '../../components/seleccion/PanelDecisiones'
import useConvocatoriaDeUrl from '../../hooks/useConvocatoriaDeUrl'
import useFiltroEstadoSeleccion from '../../hooks/useFiltroEstadoSeleccion'
import useFiltrosUrl from '../../hooks/useFiltrosUrl'
import useModalidadConvocatoria from '../../hooks/useModalidadConvocatoria'

// La convocatoria vive en la URL: sobrevive a recargar y se puede compartir.
const CLAVES = ['convocatoria', 'estado']

// Etapa 6 de Selección: decisiones sobre los finalistas y control de cupos. La pantalla exige seleccion:decidir (guard de
// la ruta); la API de lectura pide seleccion:ver y la de escritura seleccion:decidir. Los botones de escritura salen según
// el permiso real, no solo por llegar a la pantalla.
export default function SeleccionDecidir() {
  const { can } = useAuth()
  const { valores, setValores } = useFiltrosUrl(CLAVES)
  const [datos, setDatos] = useState(null)

  const convocatoriaId = valores.convocatoria
  const [filtroEstado, cambiarFiltroEstado] = useFiltroEstadoSeleccion(valores.estado, setValores)

  const elegir = useCallback(
    (convocatoria) => {
      setDatos(convocatoria)
      setValores({ convocatoria: convocatoria.id }, { reemplazar: false })
    },
    [setValores],
  )

  const resuelta = useConvocatoriaDeUrl(convocatoriaId, datos)
  const modalidad = useModalidadConvocatoria(convocatoriaId)
  const codigoEstado = resuelta.datos?.estado?.codigo ?? null
  // null = aún se desconoce: no se afirma nada hasta saberlo.
  const enProceso = codigoEstado == null ? null : codigoEstado === 'en_proceso'

  return (
    <PaginaSeleccion
      titulo="Decidir selección"
      textoVacio="Verás los cupos, los finalistas de la lista vigente y podrás registrar o rectificar sus decisiones."
      convocatoriaId={convocatoriaId}
      actual={resuelta.datos}
      resuelta={resuelta}
      modalidad={modalidad}
      conVacantes={false}
      onElegir={elegir}
      filtroEstado={filtroEstado}
      onFiltroEstado={cambiarFiltroEstado}
    >
      <PanelDecisiones
        key={convocatoriaId}
        convocatoriaId={convocatoriaId}
        enProceso={enProceso}
        puedeDecidir={can('seleccion:decidir')}
      />
    </PaginaSeleccion>
  )
}
