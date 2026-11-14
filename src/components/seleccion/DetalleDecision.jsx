import { useId, useState } from 'react'
import { IconoX } from '../convocatorias/Iconos'
import { EtiquetaConIcono } from '../evaluacion/PresentacionEvaluacion'
import AvatarIniciales from '../evaluacion/AvatarIniciales'
import Boton from '../ui/Boton'
import Dialogo from '../ui/Dialogo'
import Icono from '../ui/Icono'
import Pestanas from '../ui/Pestanas'
import EvidenciaFinalista from './EvidenciaFinalista'
import HistorialDecision from './HistorialDecision'
import { CLASE_TEXTO_FUERTE, CLASE_TEXTO_PARTIDO, CLASE_TEXTO_SUAVE } from '../../lib/estilos'
import { ESTADO_DECISION } from '../../lib/seleccion'

// Detalle de UN finalista en Decidir: la evidencia para decidir sobre él y, si ya tiene decisión, su historial. Es el mismo
// patrón que «Ver detalle» de Preselección (diálogo con pestañas) y mantiene compacta la tabla. El padre lo monta con
// key = id del candidato: al abrir otro empieza de cero. 'fila' es la fila viva de la tabla.
export default function DetalleDecision({ convocatoriaId, fila, lista, puedeDecidir, onCerrar }) {
  const idTitulo = useId()
  const [pestana, setPestana] = useState('evidencia')
  const estado = ESTADO_DECISION[fila.estado] ?? ESTADO_DECISION.pendiente

  const pestanas = [
    {
      id: 'evidencia',
      etiqueta: 'Evidencia',
      contenido: <EvidenciaFinalista convocatoriaId={convocatoriaId} fila={fila} lista={lista} puedeDecidir={puedeDecidir} />,
    },
    // Sin decisión no hay historial que consultar: queda solo la evidencia, sin pestañas.
    ...(fila.decision
      ? [
          {
            id: 'historial',
            etiqueta: 'Historial',
            contenido: <HistorialDecision convocatoriaId={convocatoriaId} postulacionId={fila.postulacion_id} activo={pestana === 'historial'} />,
          },
        ]
      : []),
  ]

  return (
    <Dialogo idTitulo={idTitulo} onCerrar={onCerrar} className="max-w-3xl">
      <div className="@container flex flex-col gap-4 p-4 sm:p-6">
        <header className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <AvatarIniciales nombre={fila.aspirante ?? '?'} />
            <div className="flex min-w-0 flex-col gap-1.5">
              <h2 id={idTitulo} className={`text-lg font-semibold ${CLASE_TEXTO_PARTIDO} ${CLASE_TEXTO_FUERTE}`}>
                {fila.aspirante}
              </h2>
              <div className="flex flex-wrap items-center gap-2">
                <EtiquetaConIcono tono={estado.tono} icono={<Icono nombre={estado.icono} className="size-3.5" />}>
                  {estado.texto}
                </EtiquetaConIcono>
                <span className={`text-sm ${CLASE_TEXTO_SUAVE}`}>
                  {!fila.en_lista
                    ? 'Fuera de la lista vigente'
                    : fila.posicion == null
                      ? 'Finalista sin posición'
                      : `Posición ${fila.posicion}`}
                </span>
              </div>
            </div>
          </div>
          <Boton variante="fantasma" tamano="tactil" onClick={onCerrar} aria-label="Cerrar el detalle del candidato">
            <IconoX className="size-5" />
          </Boton>
        </header>

        {pestanas.length > 1 ? (
          <Pestanas etiquetaAccesible="Detalle del finalista" pestanas={pestanas} activaId={pestana} onCambiar={setPestana} />
        ) : (
          pestanas[0].contenido
        )}
      </div>
    </Dialogo>
  )
}
