import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import EtiquetaPostulacion from '../../components/convocatorias/EtiquetaPostulacion'
import PanelDocumentosPostulacion from '../../components/postulacion/PanelDocumentosPostulacion'

const CLASE_BOTON =
  'self-start rounded border border-sena-azul/25 px-4 py-2 text-sm font-medium text-sena-azul hover:bg-sena-cielo/30 dark:border-sena-borde dark:text-sena-texto dark:hover:bg-sena-superficie-alta'

// Envoltorio del paso de documentos/skills de UNA postulación propia. Todo el
// contenido vive en PanelDocumentosPostulacion (mismo panel que usa el detalle
// de la convocatoria); aquí solo va el encabezado de la página. El panel es la
// fuente del estado y lo comparte con onEstadoChange para el encabezado.
export default function DocumentosPostulacion() {
  const { id } = useParams()
  // key={id}: al cambiar de postulación se re-monta y no se cruza el estado.
  return <Contenido key={id} postulacionId={id} />
}

function Contenido({ postulacionId }) {
  const navigate = useNavigate()
  const [estado, setEstado] = useState(null)

  const alEnviar = () =>
    navigate('/mis-postulaciones', {
      state: {
        exito: `Enviaste tu postulación a "${estado?.convocatoria?.nombre ?? 'la convocatoria'}".`,
      },
    })

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button type="button" onClick={() => navigate('/mis-postulaciones')} className={CLASE_BOTON}>
          ← Mis postulaciones
        </button>
        {estado && (
          <EtiquetaPostulacion
            codigo={estado.postulacion?.estado?.codigo}
            nombre={estado.postulacion?.estado?.nombre}
          />
        )}
      </div>

      <div>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-sena-texto">
          Documentos de la postulación
        </h1>
        <p className="text-xs text-slate-500 dark:text-sena-texto-suave">
          {estado ? estado.convocatoria?.nombre : 'Cargando...'}
        </p>
      </div>

      <PanelDocumentosPostulacion
        postulacionId={postulacionId}
        onEstadoChange={setEstado}
        onEnviado={alEnviar}
      />
    </div>
  )
}
