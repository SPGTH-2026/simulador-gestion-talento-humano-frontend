import { Link } from 'react-router-dom'
import { useAuth } from '../../../auth/useAuth'
import Boton from '../../ui/Boton'
import AyudaRequisitos from '../AyudaRequisitos'
import { CLASE_TEXTO_FUERTE, CLASE_TEXTO_SUAVE } from '../../../lib/estilos'
import { FALTA_PARA_ESTAR_LISTO, rutaPreseleccion } from '../../../lib/pasosSeleccion'

// Sección de PanelRanking. Recibe solo lo que muestra, por props. Dice QUÉ puede faltarles a quienes
// aún no están listos (visible), deja la regla completa en la ayuda desplegable y lleva a revisar a cada candidato en
// Preselección; no afirma que alguien ya sea elegible.
export default function SinCandidatosRanking({ convocatoriaId, meta, modo }) {
  const { can } = useAuth()
  const pendientes = meta.no_listos ?? 0
  return (
    <div className="flex flex-col items-center gap-2 px-6 py-8 text-center">
      <h3 className={`text-base font-semibold ${CLASE_TEXTO_FUERTE}`}>Aún no hay candidatos listos</h3>
      <p className={`max-w-md text-sm ${CLASE_TEXTO_SUAVE}`}>
        {pendientes > 0
          ? `${pendientes === 1 ? 'Hay 1 candidato' : `Hay ${pendientes} candidatos`} que todavía no cumple${pendientes === 1 ? '' : 'n'} los requisitos. Puede faltar ${FALTA_PARA_ESTAR_LISTO[modo] ?? FALTA_PARA_ESTAR_LISTO.con_actividades}.`
          : `Puede faltar ${FALTA_PARA_ESTAR_LISTO[modo] ?? FALTA_PARA_ESTAR_LISTO.con_actividades}.`}
      </p>
      {can('seleccion:ver') && (
        <Boton as={Link} to={rutaPreseleccion(convocatoriaId)} variante="contorno" tamano="flexible">
          Revisar los candidatos en Preselección
        </Boton>
      )}
      <AyudaRequisitos modo={modo} className="max-w-md text-left" />
    </div>
  )
}
