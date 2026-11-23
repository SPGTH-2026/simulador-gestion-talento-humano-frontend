import { Link } from 'react-router-dom'
import { CLASE_TEXTO_FUERTE, CLASE_TEXTO_SUAVE } from '../../../lib/estilos'

// Sección de PanelRanking. Recibe el estado y las acciones del componente en la prop ctx.
export default function SinConfigurarRanking({ ctx }) {
  const { convocatoriaId, meta, seleccion } = ctx
  return (
  <div className="flex flex-col items-center gap-3 px-6 py-8 text-center">
    <h3 className={`text-base font-semibold ${CLASE_TEXTO_FUERTE}`}>Falta configurar las actividades</h3>
    <p className={`max-w-md text-sm ${CLASE_TEXTO_SUAVE}`}>
      Mientras no se configure la entrevista y la prueba técnica (o se elija «Sin actividades»), nadie entra en el ranking.
      {meta.no_listos > 0 && ` Hay ${meta.postuladas} ${meta.postuladas === 1 ? 'candidato' : 'candidatos'} esperando.`}
    </p>
    <Link
      to={`/seleccion/preseleccion?convocatoria=${convocatoriaId}&pestana=configuracion`}
      className="inline-flex min-h-11 items-center justify-center rounded-lg border border-sena-azul/60 px-4 text-sm font-semibold text-sena-azul hover:bg-sena-cielo/30 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sena dark:border-sena-texto-suave/70 dark:text-sena-texto dark:hover:bg-sena-superficie-alta"
    >
      Ir a la configuración
    </Link>
  </div>
  )
}
