import { Link } from 'react-router-dom'
import { useAuth } from '../../auth/useAuth'
import Boton from '../ui/Boton'
import AyudaRequisitos from './AyudaRequisitos'
import { CLASE_CAJA_SUAVE, CLASE_TEXTO_FUERTE } from '../../lib/estilos'
import { SIGUIENTE_PASO, rutaPreseleccion, rutaRanking } from '../../lib/pasosSeleccion'

// «Siguiente paso» del flujo de Selección para UNA convocatoria: una frase, la acción principal y, si aplica, un enlace
// secundario. Los requisitos completos quedan en la ayuda desplegable. Los enlaces conservan la convocatoria y solo se ofrecen
// a quien puede ver Selección (seleccion:ver); sin ese permiso queda el texto. Los enlaces llevan a REVISAR: no afirman que los
// candidatos ya sean elegibles.
export default function PasoSiguienteSeleccion({ convocatoriaId, modo }) {
  const { can } = useAuth()
  const sinActividades = modo === 'sin_actividades'
  const modalidad = sinActividades ? 'sin_actividades' : 'con_actividades'
  const puedeVer = can('seleccion:ver')

  return (
    <section aria-label="Siguiente paso" className={`${CLASE_CAJA_SUAVE} flex flex-col gap-2 p-4`}>
      <h3 className={`text-sm font-semibold ${CLASE_TEXTO_FUERTE}`}>Siguiente paso</h3>
      <p className={`text-sm ${CLASE_TEXTO_FUERTE}`}>{SIGUIENTE_PASO[modalidad]}</p>
      {puedeVer && (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pt-1">
          {/* Acción principal: sin actividades no hay notas, se sigue en Ranking; con actividades se empieza por los candidatos. */}
          {sinActividades ? (
            <Boton as={Link} to={rutaRanking(convocatoriaId)} tamano="flexible">
              Ir a Ranking y finalistas
            </Boton>
          ) : (
            <>
              <Boton as={Link} to={rutaPreseleccion(convocatoriaId)} tamano="flexible">
                Ir a los candidatos
              </Boton>
              <Boton as={Link} to={rutaRanking(convocatoriaId)} variante="enlace" tamano="flexible">
                Ver Ranking y finalistas
              </Boton>
            </>
          )}
        </div>
      )}
      <AyudaRequisitos modo={modalidad} />
    </section>
  )
}
