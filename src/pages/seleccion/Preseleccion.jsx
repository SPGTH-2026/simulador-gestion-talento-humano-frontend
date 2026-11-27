import { useCallback, useEffect, useRef, useState } from 'react'
import { useAuth } from '../../auth/useAuth'
import PaginaSeleccion from '../../components/seleccion/PaginaSeleccion'
import PanelCandidatos from '../../components/seleccion/PanelCandidatos'
import PanelConfiguracion from '../../components/seleccion/PanelConfiguracion'
import Pestanas from '../../components/ui/Pestanas'
import useConvocatoriaDeUrl from '../../hooks/useConvocatoriaDeUrl'
import useFiltroEstadoSeleccion from '../../hooks/useFiltroEstadoSeleccion'
import useFiltrosUrl from '../../hooks/useFiltrosUrl'
import useModalidadConvocatoria from '../../hooks/useModalidadConvocatoria'

// La convocatoria y la pestaña viven en la URL: sobreviven a recargar y se pueden compartir.
const CLAVES = ['convocatoria', 'pestana', 'estado']

export default function Preseleccion() {
  const { can } = useAuth()
  const { valores, setValores } = useFiltrosUrl(CLAVES)
  // Datos de la convocatoria elegida (nombre, estado...). El id manda: viene de la URL.
  const [datos, setDatos] = useState(null)

  const convocatoriaId = valores.convocatoria
  const [filtroEstado, cambiarFiltroEstado] = useFiltroEstadoSeleccion(valores.estado, setValores)
  const pestana = valores.pestana === 'configuracion' ? 'configuracion' : 'candidatos'

  // Si se llega a Configuración por un enlace (p. ej. desde el detalle de un candidato) el foco no queda en la nada: pasa a la
  // pestaña. Si el cambio lo hizo el propio usuario sobre las pestañas, el foco ya está ahí y no se toca.
  const pestanaPrevia = useRef(pestana)
  useEffect(() => {
    if (pestanaPrevia.current !== pestana && pestana === 'configuracion') {
      const foco = document.activeElement
      if (!foco || foco === document.body || !foco.closest('[role="tablist"]')) document.getElementById('tab-configuracion')?.focus()
    }
    pestanaPrevia.current = pestana
  }, [pestana])

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
  const modalidad = useModalidadConvocatoria(convocatoriaId)

  return (
    <PaginaSeleccion
      titulo="Preselección"
      textoVacio="Verás sus candidatos y su configuración de actividades."
      convocatoriaId={convocatoriaId}
      actual={resuelta.datos}
      resuelta={resuelta}
      modalidad={modalidad}
      onElegir={elegir}
      filtroEstado={filtroEstado}
      onFiltroEstado={cambiarFiltroEstado}
    >
      {/* key = convocatoria: al cambiar, cada panel nace de cero (página 1, sin datos de la anterior) y sus respuestas tardías
          se descartan. */}
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
            contenido: <PanelCandidatos key={convocatoriaId} convocatoriaId={convocatoriaId} activo={pestana === 'candidatos'} />,
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
                onGuardada={modalidad.recargar}
              />
            ),
          },
        ]}
      />
    </PaginaSeleccion>
  )
}
