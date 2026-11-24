import { CLASE_TEXTO_FUERTE, CLASE_TEXTO_SUAVE } from '../../../lib/estilos'

// Sección de PanelRanking. Recibe solo lo que muestra, por props.
export default function SinCandidatosRanking() {
  return (
  <div className="flex flex-col items-center gap-2 px-6 py-8 text-center">
    <h3 className={`text-base font-semibold ${CLASE_TEXTO_FUERTE}`}>Aún no hay candidatos listos</h3>
    <p className={`max-w-md text-sm ${CLASE_TEXTO_SUAVE}`}>
      Aparecen cuando están habilitados documentalmente y con todas sus actividades calificadas.
    </p>
  </div>
  )
}
