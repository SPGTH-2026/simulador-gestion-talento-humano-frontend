import { useId, useState } from 'react'
import { IconoX } from '../convocatorias/Iconos'
import { EtiquetaConIcono } from '../evaluacion/PresentacionEvaluacion'
import AvatarIniciales from '../evaluacion/AvatarIniciales'
import Boton from '../ui/Boton'
import Dialogo from '../ui/Dialogo'
import Icono from '../ui/Icono'
import Pestanas from '../ui/Pestanas'
import PanelCalificaciones from './PanelCalificaciones'
import PanelReferencia from './PanelReferencia'
import { CLASE_TEXTO_FUERTE, CLASE_TEXTO_PARTIDO, CLASE_TEXTO_SUAVE } from '../../lib/estilos'
import { estadoDocumental, textoCumplimiento } from '../../lib/seleccion'

// Detalle de UN candidato: calificaciones (siempre) y referencia documental (solo Instructor y Superadministrador).
// El padre lo monta con key = id del candidato, así que al abrir otro empieza de cero y las respuestas del anterior
// no lo alcanzan. 'fila' es la fila viva de la lista: el estado del encabezado cambia cuando el servidor lo cambia.
export default function DetalleCandidato({ convocatoriaId, fila, puedeDecidir, puedeDesignar, pestanaInicial = 'calificaciones', onCerrar, onCambio }) {
  const idTitulo = useId()
  const [pestana, setPestana] = useState(puedeDesignar || pestanaInicial !== 'referencia' ? pestanaInicial : 'calificaciones')
  // Sube cuando cambia la referencia: las calificaciones dependen de la habilitación documental.
  const [recarga, setRecarga] = useState(0)
  const doc = estadoDocumental(fila.estado_documental)

  const alCambiar = (cambio) => {
    onCambio(cambio)
    if (cambio.referenciaCambio) setRecarga((n) => n + 1)
  }

  const pestanas = [
    {
      id: 'calificaciones',
      etiqueta: 'Calificaciones',
      contenido: (
        <PanelCalificaciones
          convocatoriaId={convocatoriaId}
          postulacionId={fila.id}
          puedeDecidir={puedeDecidir}
          recarga={recarga}
          onCambio={alCambiar}
          onIrAConfiguracion={onCerrar}
        />
      ),
    },
    ...(puedeDesignar
      ? [
          {
            id: 'referencia',
            etiqueta: 'Referencia documental',
            contenido: (
              <PanelReferencia
                convocatoriaId={convocatoriaId}
                postulacionId={fila.id}
                activo={pestana === 'referencia'}
                onCambio={alCambiar}
              />
            ),
          },
        ]
      : []),
  ]

  return (
    <Dialogo idTitulo={idTitulo} onCerrar={onCerrar} className="max-w-3xl">
      <div className="flex flex-col gap-4 p-4 sm:p-6">
        <header className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <AvatarIniciales nombre={fila.aspirante} />
            <div className="flex min-w-0 flex-col gap-1.5">
              <h2 id={idTitulo} className={`text-lg font-semibold ${CLASE_TEXTO_PARTIDO} ${CLASE_TEXTO_FUERTE}`}>
                {fila.aspirante}
              </h2>
              <div className="flex flex-wrap items-center gap-2">
                <EtiquetaConIcono tono={doc.tono} icono={<Icono nombre={doc.icono} className="size-3.5" />}>
                  {doc.texto}
                </EtiquetaConIcono>
                {textoCumplimiento(fila.cumplimiento) != null && (
                  <span className={`text-sm tabular-nums ${CLASE_TEXTO_SUAVE}`}>
                    Cumplimiento {textoCumplimiento(fila.cumplimiento)}
                  </span>
                )}
              </div>
            </div>
          </div>
          <Boton variante="fantasma" tamano="tactil" onClick={onCerrar} aria-label="Cerrar el detalle del candidato">
            <IconoX className="size-5" />
          </Boton>
        </header>

        {pestanas.length > 1 ? (
          <Pestanas
            etiquetaAccesible="Detalle del candidato"
            pestanas={pestanas}
            activaId={pestana}
            onCambiar={setPestana}
          />
        ) : (
          pestanas[0].contenido
        )}
      </div>
    </Dialogo>
  )
}
