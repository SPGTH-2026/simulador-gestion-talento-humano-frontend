import { useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import EtiquetaPostulacion from '../../components/convocatorias/EtiquetaPostulacion'
import PanelDocumentosPostulacion from '../../components/postulacion/PanelDocumentosPostulacion'
import Boton from '../../components/ui/Boton'
import Icono from '../../components/ui/Icono'
import { CLASE_TITULO_PAGINA } from '../../lib/estilos'


// Envoltorio del paso de documentos/skills de UNA postulación propia. Todo el
// contenido vive en PanelDocumentosPostulacion (mismo panel que usa el detalle
// de la convocatoria); aquí solo va el encabezado de la página. El panel es la
// fuente del estado y lo comparte con onEstadoChange para el encabezado.
// soloCorreccion: la ruta de correcciones fija el modo corrección.
export default function DocumentosPostulacion({ soloCorreccion = false }) {
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  // Desde "Mis evaluaciones" se abre con ?correccion=1: solo los documentos por corregir.
  const modoCorreccion = soloCorreccion || searchParams.get('correccion') === '1'
  // key: al cambiar de postulación o de modo se re-monta y no se cruza el estado.
  return <Contenido key={`${id}-${modoCorreccion}`} postulacionId={id} modoCorreccion={modoCorreccion} />
}

function Contenido({ postulacionId, modoCorreccion }) {
  const navigate = useNavigate()
  const [estado, setEstado] = useState(null)

  const alEnviar = () =>
    navigate('/mis-postulaciones', {
      state: {
        exito: `Enviaste tu postulación a "${estado?.convocatoria?.nombre ?? 'la convocatoria'}".`,
      },
    })

  const alEnviarCorreccion = () =>
    navigate('/mis-evaluaciones', {
      state: { exito: 'Enviaste la corrección de tus documentos. El evaluador la revisará.' },
    })

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Boton
          variante="fantasma"
          tamano="tactil"
          onClick={() => navigate(modoCorreccion ? '/mis-evaluaciones' : '/mis-postulaciones')}
        >
          <Icono nombre="flechaIzquierda" className="size-4" />
          {modoCorreccion ? 'Mis evaluaciones' : 'Mis postulaciones'}
        </Boton>
        {estado && (
          <EtiquetaPostulacion
            codigo={estado.postulacion?.estado?.codigo}
            nombre={estado.postulacion?.estado?.nombre}
          />
        )}
      </div>

      <div>
        <h1 className={CLASE_TITULO_PAGINA}>
          {modoCorreccion ? 'Corregir documentos' : 'Documentos de la postulación'}
        </h1>
        <p className="text-xs text-slate-500 dark:text-sena-texto-suave">
          {estado ? estado.convocatoria?.nombre : 'Cargando…'}
        </p>
      </div>

      <PanelDocumentosPostulacion
        postulacionId={postulacionId}
        onEstadoChange={setEstado}
        onEnviado={alEnviar}
        modoCorreccion={modoCorreccion}
        onCorreccionEnviada={alEnviarCorreccion}
      />
    </div>
  )
}
